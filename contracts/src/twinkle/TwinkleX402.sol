// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./base/TwinkleDefensive.sol";

/**
 * @title IMNEEX402
 * @notice Minimal interface for MNEE-specific functions
 */
interface IMNEEX402 {
    function paused() external view returns (bool);
    function blacklisted(address account) external view returns (bool);
    function frozen(address account) external view returns (bool);
}

/**
 * @title ITwinkleCoreX402
 * @notice Minimal interface for TwinkleCore dependency
 */
interface ITwinkleCoreX402 {
    function mnee() external view returns (address);
    function treasury() external view returns (address);
    function calculateFee(uint256 amount) external view returns (uint256);
    function paused() external view returns (bool);
}

/**
 * @title ITwinklePay
 * @notice Interface for TwinklePay paywall integration
 */
interface ITwinklePay {
    function unlockForUser(bytes32 paywallId, address user) external;
    function isUnlocked(bytes32 paywallId, address user) external view returns (bool);
}

/**
 * @title TwinkleX402
 * @notice x402 HTTP Payment Protocol Implementation for MNEE
 * @author Twinkle
 *
 * @dev Enables AI agents to pay for content using the x402 protocol:
 *
 * x402 Flow:
 * 1. Content server returns HTTP 402 with X-Payment-Required header
 * 2. AI agent creates EIP-3009 transferWithAuthorization signature
 * 3. Agent sends authorization to facilitator for verification
 * 4. Facilitator calls settle() to execute payment on-chain
 * 5. Contract returns accessProof for content delivery
 * 6. Agent includes proof in subsequent request to access content
 *
 * Key features:
 * - Full EIP-3009 support for gasless authorized transfers
 * - Payment request creation and expiration handling
 * - Access proof generation for content gating
 * - TwinklePay integration for paywall unlocking
 * - CDP Facilitator fallback for immediate production support
 * - Platform fee collection (2.5%)
 */
contract TwinkleX402 is ReentrancyGuard, TwinkleDefensive, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============ Structs ============

    /**
     * @notice Payment request created by content provider
     * @param payTo Recipient address (creator/content provider)
     * @param amount Payment amount in MNEE wei
     * @param paywallId Optional TwinklePay paywall ID for access control
     * @param validUntil Expiration timestamp
     * @param nonce Unique nonce to prevent replay
     * @param settled Whether payment has been settled
     * @param creator Address that created the request
     */
    struct PaymentRequest {
        address payTo;
        uint128 amount;
        bytes32 paywallId;
        uint40 validUntil;
        bytes32 nonce;
        bool settled;
        address creator;
    }

    /**
     * @notice EIP-712 Payment Intent - signed by AI agent to authorize payment
     * @dev Agent must pre-approve TwinkleX402 for MNEE spending before signing
     * @param payer Agent wallet address
     * @param requestId Payment request being fulfilled
     * @param amount Amount to pay in MNEE wei
     * @param validUntil Intent expiration timestamp
     * @param nonce Unique nonce for replay protection
     */
    struct PaymentIntent {
        address payer;
        bytes32 requestId;
        uint256 amount;
        uint256 validUntil;
        uint256 nonce;
    }

    /**
     * @notice AP2 (Agent Payments Protocol) metadata
     * @dev Tracks AI agent information for analytics and compliance
     * @param agentId Unique agent identifier (e.g., keccak256("claude-4"))
     * @param agentType Agent type string ("claude", "gpt", "gemini", "custom")
     * @param sessionId Agent session for tracking
     * @param metadata Additional agent-specific data (JSON encoded)
     */
    struct AgentPaymentInfo {
        bytes32 agentId;
        string agentType;
        bytes32 sessionId;
        bytes metadata;
    }

    /**
     * @notice Access proof for content delivery
     * @param requestId Original payment request ID
     * @param payer Address that paid
     * @param recipient Content provider address
     * @param amount Amount paid
     * @param paywallId Associated paywall (if any)
     * @param timestamp When payment was settled
     * @param blockNumber Block when settled
     */
    struct AccessProof {
        bytes32 requestId;
        address payer;
        address recipient;
        uint128 amount;
        bytes32 paywallId;
        uint40 timestamp;
        uint256 blockNumber;
    }

    // ============ Constants ============

    /// @notice Default validity period for payment requests (1 hour)
    uint256 public constant DEFAULT_VALIDITY_PERIOD = 1 hours;

    /// @notice Maximum validity period for payment requests (24 hours)
    uint256 public constant MAX_VALIDITY_PERIOD = 24 hours;

    /// @notice Minimum payment amount (to prevent dust attacks)
    uint256 public constant MIN_PAYMENT_AMOUNT = 1e15; // 0.001 MNEE

    /// @notice Default access proof validity (30 days)
    uint256 public constant DEFAULT_ACCESS_PROOF_VALIDITY = 30 days;

    /// @notice EIP-712 typehash for PaymentIntent
    bytes32 public constant PAYMENT_INTENT_TYPEHASH = keccak256(
        "PaymentIntent(address payer,bytes32 requestId,uint256 amount,uint256 validUntil,uint256 nonce)"
    );

    // ============ Immutables ============

    /// @notice TwinkleCore contract reference
    ITwinkleCoreX402 public immutable core;

    /// @notice MNEE token contract
    IERC20 public immutable mnee;

    /// @notice Authorized facilitator address (backend service)
    address public immutable facilitator;

    /// @notice TwinklePay contract for paywall integration
    address public twinklePay;

    // ============ Storage ============

    /// @notice Payment requests by ID
    mapping(bytes32 => PaymentRequest) public paymentRequests;

    /// @notice Used nonces for payment requests (prevent replay)
    mapping(bytes32 => bool) public usedNonces;

    /// @notice Used nonces for payment intents (prevent replay)
    mapping(uint256 => bool) public usedIntentNonces;

    /// @notice Access proofs by ID (for verification)
    mapping(bytes32 => AccessProof) public accessProofs;

    /// @notice Revoked access proofs
    mapping(bytes32 => bool) public revokedAccessProofs;

    /// @notice Access proof validity period (configurable)
    uint256 public accessProofValidity;

    /// @notice Total payments settled through x402
    uint256 public totalSettled;

    /// @notice Total platform fees collected
    uint256 public totalFeesCollected;

    /// @notice Total agent payments (AP2)
    uint256 public totalAgentPayments;

    // ============ Events ============

    event PaymentRequestCreated(
        bytes32 indexed requestId,
        address indexed payTo,
        uint256 amount,
        bytes32 paywallId,
        uint256 validUntil,
        address creator
    );

    event PaymentRequestCancelled(
        bytes32 indexed requestId,
        address indexed creator
    );

    event PaymentSettled(
        bytes32 indexed requestId,
        address indexed from,
        address indexed payTo,
        uint256 amount,
        uint256 platformFee,
        bytes32 accessProofId
    );

    event PaymentSettledViaCDP(
        bytes32 indexed requestId,
        address indexed payer,
        address indexed payTo,
        uint256 amount,
        bytes32 cdpReference
    );

    event AuthorizationVerified(
        bytes32 indexed requestId,
        address indexed from,
        bool valid
    );

    event ContentAccessGranted(
        bytes32 indexed requestId,
        bytes32 indexed paywallId,
        address indexed payer,
        bytes32 accessProofId
    );

    event TwinklePayUpdated(address indexed oldPay, address indexed newPay);

    event AgentPaymentSettled(
        bytes32 indexed requestId,
        bytes32 indexed agentId,
        string agentType,
        bytes32 sessionId,
        uint256 amount
    );

    event BatchPaymentSettled(
        uint256 indexed batchId,
        uint256 count,
        uint256 totalAmount,
        uint256 totalFees
    );

    event AccessProofRevoked(bytes32 indexed accessProofId, address indexed revokedBy);

    event AccessProofValidityUpdated(uint256 oldValidity, uint256 newValidity);

    // ============ Errors ============

    error RequestNotFound();
    error RequestExpired();
    error RequestAlreadySettled();
    error NonceAlreadyUsed();
    error InvalidAuthorization();
    error NotFacilitator();
    error InvalidRecipient();
    error AmountTooSmall();
    error ValidityTooLong();
    error NotRequestCreator();
    error PaywallNotConfigured();
    error ProtocolPaused();
    error InvalidSignature();
    error IntentExpired();
    error IntentNonceUsed();
    error RequestMismatch();
    error AmountMismatch();
    error InsufficientAllowance();
    error AccessProofAlreadyRevoked();
    error BatchEmpty();
    error BatchTooLarge();
    error ArrayLengthMismatch();
    error MNEEPaused();

    // ============ Modifiers ============

    modifier onlyFacilitator() {
        if (msg.sender != facilitator) revert NotFacilitator();
        _;
    }

    modifier whenNotPaused() {
        if (core.paused()) revert ProtocolPaused();
        _;
    }

    modifier whenMNEENotPaused() {
        if (IMNEEX402(address(mnee)).paused()) revert MNEEPaused();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Deploy TwinkleX402 contract
     * @param _core TwinkleCore contract address
     * @param _facilitator Authorized facilitator (backend service)
     * @param _twinklePay TwinklePay contract for paywall integration
     */
    constructor(
        address _core,
        address _facilitator,
        address _twinklePay
    ) EIP712("TwinkleX402", "2") {
        if (_core == address(0)) revert InvalidRecipient();
        if (_facilitator == address(0)) revert InvalidRecipient();

        core = ITwinkleCoreX402(_core);
        mnee = IERC20(core.mnee());
        facilitator = _facilitator;
        twinklePay = _twinklePay;

        // Set default access proof validity
        accessProofValidity = DEFAULT_ACCESS_PROOF_VALIDITY;

        // Enable MNEE integrity checking
        _enableMNEEIntegrityCheck(address(mnee));
    }

    // ============ Payment Request Functions ============

    /**
     * @notice Create a payment request for content
     * @param payTo Recipient address (content provider)
     * @param amount Payment amount in MNEE wei
     * @param paywallId Optional paywall ID for TwinklePay integration
     * @param validFor How long the request is valid (seconds)
     * @return requestId Unique request identifier
     *
     * @dev Anyone can create a payment request. The request is only
     * fulfilled when settle() is called with valid authorization.
     */
    function createPaymentRequest(
        address payTo,
        uint128 amount,
        bytes32 paywallId,
        uint256 validFor
    ) external whenNotPaused returns (bytes32 requestId) {
        if (payTo == address(0)) revert InvalidRecipient();
        if (amount < MIN_PAYMENT_AMOUNT) revert AmountTooSmall();
        if (validFor > MAX_VALIDITY_PERIOD) revert ValidityTooLong();
        if (validFor == 0) validFor = DEFAULT_VALIDITY_PERIOD;

        // Generate unique nonce
        bytes32 nonce = keccak256(abi.encodePacked(
            payTo,
            amount,
            paywallId,
            block.timestamp,
            block.prevrandao,
            msg.sender,
            totalSettled
        ));

        if (usedNonces[nonce]) revert NonceAlreadyUsed();
        usedNonces[nonce] = true;

        requestId = keccak256(abi.encodePacked(nonce, msg.sender, block.number));

        uint40 validUntil = uint40(block.timestamp + validFor);

        paymentRequests[requestId] = PaymentRequest({
            payTo: payTo,
            amount: amount,
            paywallId: paywallId,
            validUntil: validUntil,
            nonce: nonce,
            settled: false,
            creator: msg.sender
        });

        emit PaymentRequestCreated(
            requestId,
            payTo,
            amount,
            paywallId,
            validUntil,
            msg.sender
        );
    }

    /**
     * @notice Cancel a pending payment request
     * @param requestId The request ID to cancel
     * @dev Only the original creator can cancel
     */
    function cancelPaymentRequest(bytes32 requestId) external {
        PaymentRequest storage request = paymentRequests[requestId];
        if (request.payTo == address(0)) revert RequestNotFound();
        if (request.settled) revert RequestAlreadySettled();
        if (request.creator != msg.sender) revert NotRequestCreator();

        request.settled = true; // Mark as settled to prevent use

        emit PaymentRequestCancelled(requestId, msg.sender);
    }

    // ============ Intent Verification ============

    /**
     * @notice Verify an EIP-712 payment intent (view function)
     * @param requestId Payment request ID
     * @param intent Payment intent data
     * @param signature EIP-712 signature from agent
     * @return valid Whether the intent appears valid
     * @return reason Human-readable reason if invalid
     *
     * @dev This is a view function for off-chain verification.
     * Does not guarantee the intent will succeed on-chain
     * (e.g., balance or allowance could change between verification and settlement).
     */
    function verifyIntent(
        bytes32 requestId,
        PaymentIntent calldata intent,
        bytes calldata signature
    ) external view returns (bool valid, string memory reason) {
        PaymentRequest storage request = paymentRequests[requestId];

        // Check request exists and is valid
        if (request.payTo == address(0)) {
            return (false, "Request not found");
        }
        if (request.settled) {
            return (false, "Already settled");
        }
        if (block.timestamp > request.validUntil) {
            return (false, "Request expired");
        }

        // Check intent matches request
        if (intent.requestId != requestId) {
            return (false, "Request ID mismatch");
        }
        if (intent.amount < request.amount) {
            return (false, "Amount too low");
        }

        // Check intent timing
        if (block.timestamp > intent.validUntil) {
            return (false, "Intent expired");
        }

        // Check intent nonce
        if (usedIntentNonces[intent.nonce]) {
            return (false, "Intent nonce already used");
        }

        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            PAYMENT_INTENT_TYPEHASH,
            intent.payer,
            intent.requestId,
            intent.amount,
            intent.validUntil,
            intent.nonce
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        if (signer != intent.payer) {
            return (false, "Invalid signature");
        }

        // Check payer balance
        uint256 balance = mnee.balanceOf(intent.payer);
        if (balance < request.amount) {
            return (false, "Insufficient balance");
        }

        // Check allowance
        uint256 allowance = mnee.allowance(intent.payer, address(this));
        if (allowance < request.amount) {
            return (false, "Insufficient allowance - agent must approve TwinkleX402");
        }

        return (true, "");
    }

    // ============ Settlement Functions ============

    /**
     * @notice Settle a payment using EIP-712 signed PaymentIntent
     * @param requestId Payment request ID
     * @param intent PaymentIntent signed by the agent
     * @param signature EIP-712 signature from agent
     * @return accessProofId Proof for content access
     *
     * @dev Only the facilitator can call this. The agent must have:
     * 1. Pre-approved TwinkleX402 for MNEE spending
     * 2. Signed a PaymentIntent with EIP-712
     *
     * Flow:
     * 1. Facilitator verifies intent signature off-chain
     * 2. Facilitator calls settle() with the intent
     * 3. Contract verifies signature on-chain
     * 4. Contract uses transferFrom (requires prior approval)
     * 5. Returns accessProofId for content delivery
     */
    function settle(
        bytes32 requestId,
        PaymentIntent calldata intent,
        bytes calldata signature
    ) external nonReentrant onlyFacilitator whenNotPaused whenMNEENotPaused returns (bytes32 accessProofId) {
        // Check MNEE hasn't been upgraded
        _checkMNEEIntegrity(address(mnee));

        PaymentRequest storage request = paymentRequests[requestId];

        // Validate request
        if (request.payTo == address(0)) revert RequestNotFound();
        if (request.settled) revert RequestAlreadySettled();
        if (block.timestamp > request.validUntil) revert RequestExpired();

        // Validate intent matches request
        if (intent.requestId != requestId) revert RequestMismatch();
        if (intent.amount < request.amount) revert AmountMismatch();

        // Validate intent timing
        if (block.timestamp > intent.validUntil) revert IntentExpired();

        // Validate intent nonce
        if (usedIntentNonces[intent.nonce]) revert IntentNonceUsed();

        // Verify EIP-712 signature
        bytes32 structHash = keccak256(abi.encode(
            PAYMENT_INTENT_TYPEHASH,
            intent.payer,
            intent.requestId,
            intent.amount,
            intent.validUntil,
            intent.nonce
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        if (signer != intent.payer) revert InvalidSignature();

        // Mark nonce as used (replay protection)
        usedIntentNonces[intent.nonce] = true;

        // Mark as settled before external calls (CEI pattern)
        request.settled = true;

        uint256 amount = request.amount;
        address payTo = request.payTo;

        // Transfer MNEE from agent to this contract
        // Agent must have pre-approved TwinkleX402
        mnee.safeTransferFrom(intent.payer, address(this), amount);

        // Calculate and collect platform fee
        uint256 platformFee = core.calculateFee(amount);
        uint256 recipientAmount = amount - platformFee;

        // Transfer fee to treasury (with blacklist fallback)
        if (platformFee > 0) {
            _safeTransferWithFallback(mnee, core.treasury(), platformFee);
            totalFeesCollected += platformFee;
        }

        // Transfer to recipient (with blacklist fallback)
        _safeTransferWithFallback(mnee, payTo, recipientAmount);

        // Update totals
        totalSettled += amount;

        // Generate access proof
        accessProofId = keccak256(abi.encodePacked(
            requestId,
            intent.payer,
            payTo,
            amount,
            request.paywallId,
            block.timestamp,
            block.number
        ));

        // Store access proof for verification
        accessProofs[accessProofId] = AccessProof({
            requestId: requestId,
            payer: intent.payer,
            recipient: payTo,
            amount: uint128(amount),
            paywallId: request.paywallId,
            timestamp: uint40(block.timestamp),
            blockNumber: block.number
        });

        emit PaymentSettled(
            requestId,
            intent.payer,
            payTo,
            amount,
            platformFee,
            accessProofId
        );

        // Unlock paywall if configured
        if (request.paywallId != bytes32(0) && twinklePay != address(0)) {
            try ITwinklePay(twinklePay).unlockForUser(request.paywallId, intent.payer) {
                emit ContentAccessGranted(requestId, request.paywallId, intent.payer, accessProofId);
            } catch {
                // Paywall unlock failed but payment succeeded
                // Content provider can grant access manually using accessProofId
            }
        }
    }

    /**
     * @notice Settle a payment with AP2 (Agent Payments Protocol) metadata
     * @param requestId Payment request ID
     * @param intent PaymentIntent signed by the agent
     * @param signature EIP-712 signature from agent
     * @param agentInfo AP2 agent metadata
     * @return accessProofId Proof for content access
     */
    function settleWithAP2(
        bytes32 requestId,
        PaymentIntent calldata intent,
        bytes calldata signature,
        AgentPaymentInfo calldata agentInfo
    ) external nonReentrant onlyFacilitator whenNotPaused whenMNEENotPaused returns (bytes32 accessProofId) {
        // Use internal settlement logic
        accessProofId = _settleInternal(requestId, intent, signature);

        // Track agent payment
        totalAgentPayments++;

        // Emit AP2 event
        emit AgentPaymentSettled(
            requestId,
            agentInfo.agentId,
            agentInfo.agentType,
            agentInfo.sessionId,
            intent.amount
        );
    }

    /**
     * @notice Settle multiple payments in a single transaction
     * @param requestIds Array of payment request IDs
     * @param intents Array of PaymentIntents
     * @param signatures Array of EIP-712 signatures
     * @return accessProofIds Array of access proof IDs
     *
     * @dev For high-concurrency AI agent scenarios. Max 20 settlements per batch.
     */
    function settleBatch(
        bytes32[] calldata requestIds,
        PaymentIntent[] calldata intents,
        bytes[] calldata signatures
    ) external nonReentrant onlyFacilitator whenNotPaused whenMNEENotPaused returns (bytes32[] memory accessProofIds) {
        uint256 len = requestIds.length;
        if (len == 0) revert BatchEmpty();
        if (len > 20) revert BatchTooLarge();
        if (len != intents.length || len != signatures.length) revert ArrayLengthMismatch();

        accessProofIds = new bytes32[](len);
        uint256 totalAmount;
        uint256 totalFees;

        for (uint256 i = 0; i < len; ) {
            accessProofIds[i] = _settleInternal(requestIds[i], intents[i], signatures[i]);
            totalAmount += intents[i].amount;
            totalFees += core.calculateFee(intents[i].amount);
            unchecked { ++i; }
        }

        emit BatchPaymentSettled(
            block.number,
            len,
            totalAmount,
            totalFees
        );
    }

    /**
     * @dev Internal settlement logic shared by settle, settleWithAP2, and settleBatch
     */
    function _settleInternal(
        bytes32 requestId,
        PaymentIntent calldata intent,
        bytes calldata signature
    ) internal returns (bytes32 accessProofId) {
        _checkMNEEIntegrity(address(mnee));

        PaymentRequest storage request = paymentRequests[requestId];

        if (request.payTo == address(0)) revert RequestNotFound();
        if (request.settled) revert RequestAlreadySettled();
        if (block.timestamp > request.validUntil) revert RequestExpired();
        if (intent.requestId != requestId) revert RequestMismatch();
        if (intent.amount < request.amount) revert AmountMismatch();
        if (block.timestamp > intent.validUntil) revert IntentExpired();
        if (usedIntentNonces[intent.nonce]) revert IntentNonceUsed();

        // Verify EIP-712 signature
        bytes32 structHash = keccak256(abi.encode(
            PAYMENT_INTENT_TYPEHASH,
            intent.payer,
            intent.requestId,
            intent.amount,
            intent.validUntil,
            intent.nonce
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        if (signer != intent.payer) revert InvalidSignature();

        usedIntentNonces[intent.nonce] = true;
        request.settled = true;

        uint256 amount = request.amount;
        address payTo = request.payTo;

        mnee.safeTransferFrom(intent.payer, address(this), amount);

        uint256 platformFee = core.calculateFee(amount);
        uint256 recipientAmount = amount - platformFee;

        // Transfer fee to treasury (with blacklist fallback)
        if (platformFee > 0) {
            _safeTransferWithFallback(mnee, core.treasury(), platformFee);
            totalFeesCollected += platformFee;
        }

        // Transfer to recipient (with blacklist fallback)
        _safeTransferWithFallback(mnee, payTo, recipientAmount);
        totalSettled += amount;

        accessProofId = keccak256(abi.encodePacked(
            requestId,
            intent.payer,
            payTo,
            amount,
            request.paywallId,
            block.timestamp,
            block.number
        ));

        accessProofs[accessProofId] = AccessProof({
            requestId: requestId,
            payer: intent.payer,
            recipient: payTo,
            amount: uint128(amount),
            paywallId: request.paywallId,
            timestamp: uint40(block.timestamp),
            blockNumber: block.number
        });

        emit PaymentSettled(requestId, intent.payer, payTo, amount, platformFee, accessProofId);

        if (request.paywallId != bytes32(0) && twinklePay != address(0)) {
            try ITwinklePay(twinklePay).unlockForUser(request.paywallId, intent.payer) {
                emit ContentAccessGranted(requestId, request.paywallId, intent.payer, accessProofId);
            } catch {}
        }
    }

    /**
     * @notice Settle a payment via Coinbase CDP Facilitator
     * @param requestId Payment request ID
     * @param payer Address that paid via CDP
     * @param cdpSignature Signature/reference from CDP transaction
     * @return accessProofId Proof for content access
     *
     * @dev Fallback settlement path when direct EIP-3009 isn't available.
     * The CDP facilitator handles the actual token transfer off-chain,
     * and this function records the settlement and generates access proof.
     *
     * SECURITY: This trusts the CDP facilitator to have actually executed
     * the transfer. Only use with trusted CDP implementations.
     */
    function settleViaCDP(
        bytes32 requestId,
        address payer,
        bytes calldata cdpSignature
    ) external nonReentrant onlyFacilitator whenNotPaused returns (bytes32 accessProofId) {
        PaymentRequest storage request = paymentRequests[requestId];

        if (request.payTo == address(0)) revert RequestNotFound();
        if (request.settled) revert RequestAlreadySettled();
        if (block.timestamp > request.validUntil) revert RequestExpired();

        // Mark as settled
        request.settled = true;

        uint256 amount = request.amount;

        // For CDP settlement, assume tokens are already transferred to recipient
        // The facilitator backend must verify the CDP transaction before calling this

        // Generate CDP reference hash
        bytes32 cdpReference = keccak256(cdpSignature);

        // Update totals (fee is collected by CDP, not on-chain)
        totalSettled += amount;

        // Generate access proof
        accessProofId = keccak256(abi.encodePacked(
            requestId,
            payer,
            request.payTo,
            amount,
            request.paywallId,
            block.timestamp,
            "CDP"
        ));

        // Store access proof
        accessProofs[accessProofId] = AccessProof({
            requestId: requestId,
            payer: payer,
            recipient: request.payTo,
            amount: uint128(amount),
            paywallId: request.paywallId,
            timestamp: uint40(block.timestamp),
            blockNumber: block.number
        });

        emit PaymentSettledViaCDP(requestId, payer, request.payTo, amount, cdpReference);

        // Unlock paywall if configured
        if (request.paywallId != bytes32(0) && twinklePay != address(0)) {
            try ITwinklePay(twinklePay).unlockForUser(request.paywallId, payer) {
                emit ContentAccessGranted(requestId, request.paywallId, payer, accessProofId);
            } catch {
                // Continue even if unlock fails
            }
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get payment request details
     * @param requestId The request ID
     * @return payTo Recipient address
     * @return amount Payment amount
     * @return paywallId Associated paywall
     * @return validUntil Expiration timestamp
     * @return settled Whether already settled
     */
    function getPaymentRequest(bytes32 requestId) external view returns (
        address payTo,
        uint128 amount,
        bytes32 paywallId,
        uint40 validUntil,
        bool settled
    ) {
        PaymentRequest storage req = paymentRequests[requestId];
        return (req.payTo, req.amount, req.paywallId, req.validUntil, req.settled);
    }

    /**
     * @notice Check if a payment request is valid and can be settled
     * @param requestId The request ID
     * @return valid True if request exists, not settled, and not expired
     */
    function isRequestValid(bytes32 requestId) external view returns (bool valid) {
        PaymentRequest storage req = paymentRequests[requestId];
        return req.payTo != address(0) && !req.settled && block.timestamp <= req.validUntil;
    }

    /**
     * @notice Verify an access proof
     * @param accessProofId The proof ID
     * @return isValid True if proof exists
     * @return proof The access proof data
     */
    function verifyAccessProof(bytes32 accessProofId) external view returns (
        bool isValid,
        AccessProof memory proof
    ) {
        proof = accessProofs[accessProofId];
        isValid = proof.requestId != bytes32(0);
    }

    /**
     * @notice Get protocol statistics
     * @return _totalSettled Total MNEE settled through x402
     * @return _totalFeesCollected Total platform fees collected
     */
    function getStats() external view returns (
        uint256 _totalSettled,
        uint256 _totalFeesCollected
    ) {
        return (totalSettled, totalFeesCollected);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update TwinklePay contract address
     * @param _newTwinklePay New TwinklePay address
     * @dev Only owner can call (via facilitator in this design)
     */
    function setTwinklePay(address _newTwinklePay) external onlyFacilitator {
        address oldPay = twinklePay;
        twinklePay = _newTwinklePay;
        emit TwinklePayUpdated(oldPay, _newTwinklePay);
    }

    /**
     * @notice Emergency function to update MNEE integrity hash
     * @dev Call after intentional MNEE upgrade
     */
    function updateMNEEIntegrityHash() external onlyFacilitator {
        _enableMNEEIntegrityCheck(address(mnee));
    }

    /**
     * @notice Disable MNEE integrity checking
     * @dev Use with caution - removes upgrade protection
     */
    function disableMNEEIntegrityCheck() external onlyFacilitator {
        _disableMNEEIntegrityCheck();
    }

    /**
     * @notice Set access proof validity period
     * @param _validity New validity period in seconds
     */
    function setAccessProofValidity(uint256 _validity) external onlyFacilitator {
        uint256 oldValidity = accessProofValidity;
        accessProofValidity = _validity;
        emit AccessProofValidityUpdated(oldValidity, _validity);
    }

    /**
     * @notice Revoke an access proof
     * @param accessProofId The access proof to revoke
     * @dev Useful for content providers to invalidate access
     */
    function revokeAccessProof(bytes32 accessProofId) external onlyFacilitator {
        if (revokedAccessProofs[accessProofId]) revert AccessProofAlreadyRevoked();
        revokedAccessProofs[accessProofId] = true;
        emit AccessProofRevoked(accessProofId, msg.sender);
    }

    /**
     * @notice Check if an access proof is valid (not revoked and not expired)
     * @param accessProofId The access proof to check
     * @return valid True if access proof is still valid
     */
    function isAccessProofValid(bytes32 accessProofId) external view returns (bool valid) {
        if (revokedAccessProofs[accessProofId]) return false;
        AccessProof storage proof = accessProofs[accessProofId];
        if (proof.requestId == bytes32(0)) return false;
        if (accessProofValidity > 0 && block.timestamp > proof.timestamp + accessProofValidity) {
            return false;
        }
        return true;
    }

    /**
     * @notice Get the EIP-712 domain separator
     * @return The domain separator used for EIP-712 signatures
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
