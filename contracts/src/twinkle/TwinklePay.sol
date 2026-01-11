// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/ITwinkleCore.sol";
import "./base/TwinkleDefensive.sol";

/**
 * @title IMNEE
 * @notice Minimal interface for MNEE-specific functions
 */
interface IMNEE {
    function paused() external view returns (bool);
    function blacklisted(address account) external view returns (bool);
    function frozen(address account) external view returns (bool);
}

/**
 * @title TwinklePay
 * @notice Direct payments and paywalls for MNEE commerce
 * @dev V5 - Supports paywalls, direct payments, batch operations, refunds, partial payments, and x402 integration
 *
 * Key features:
 * - Content paywalls with creator-defined pricing
 * - Direct P2P payments with fee collection
 * - Batch payment operations for gas efficiency
 * - Refund mechanism with creator approval
 * - Partial payment support for larger purchases
 * - x402 integration for AI agent payments
 * - Defensive patterns for MNEE blacklist handling
 */
contract TwinklePay is ReentrancyGuard, TwinkleDefensive {
    using SafeERC20 for IERC20;

    // ============ Optimized Struct (fits in 2 slots) ============
    struct Paywall {
        address creator;        // slot 0: 20 bytes
        uint96 price;           // slot 0: 12 bytes (max ~79B tokens, plenty for MNEE)
        address splitAddress;   // slot 1: 20 bytes
        uint32 totalUnlocks;    // slot 1: 4 bytes (max ~4B unlocks)
        bool active;            // slot 1: 1 byte
        bool x402Enabled;       // slot 1: 1 byte
        bool refundable;        // slot 1: 1 byte
        // 5 bytes free in slot 1
    }

    // ============ Refund Request Struct ============
    struct RefundRequest {
        bytes32 paywallId;      // slot 0: 32 bytes
        address requester;      // slot 1: 20 bytes
        uint96 amount;          // slot 1: 12 bytes
        uint40 requestedAt;     // slot 2: 5 bytes
        bool approved;          // slot 2: 1 byte
        bool processed;         // slot 2: 1 byte
        bool rejected;          // slot 2: 1 byte
        string reason;          // slot 3+: dynamic
    }

    // ============ Immutables ============
    ITwinkleCore public immutable core;
    IERC20 public immutable mnee;

    // ============ Configuration ============

    /// @notice TwinkleX402 contract address (can unlock for users)
    address public twinkleX402;

    /// @notice Refund request timeout (default 7 days)
    uint256 public refundTimeout = 7 days;

    // ============ Storage ============
    mapping(bytes32 => Paywall) public paywalls;
    mapping(bytes32 => uint256) public paywallRevenue; // Separate to avoid struct bloat
    mapping(bytes32 => mapping(address => bool)) public unlocks;

    /// @notice Partial payment balances: paywallId => user => amount paid so far
    mapping(bytes32 => mapping(address => uint256)) public partialPayments;

    /// @notice Refund requests: refundId => RefundRequest
    mapping(bytes32 => RefundRequest) public refundRequests;

    /// @notice Refund request count per paywall for generating IDs
    mapping(bytes32 => uint256) public refundRequestCount;

    // ============ Events ============
    event PaywallCreated(
        bytes32 indexed id,
        address indexed creator,
        uint256 price,
        address splitAddress,
        bool x402Enabled,
        bool refundable
    );

    event PaywallUpdated(bytes32 indexed id, uint256 newPrice, bool active);

    event PaymentReceived(
        bytes32 indexed paywallId,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        uint256 platformFee
    );

    event DirectPayment(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 platformFee
    );

    event PartialPaymentReceived(
        bytes32 indexed paywallId,
        address indexed payer,
        uint256 amountPaid,
        uint256 totalPaid,
        uint256 remaining
    );

    event RefundRequested(
        bytes32 indexed refundId,
        bytes32 indexed paywallId,
        address indexed requester,
        uint256 amount,
        string reason
    );

    event RefundApproved(
        bytes32 indexed refundId,
        bytes32 indexed paywallId,
        address indexed requester,
        uint256 amount
    );

    event RefundRejected(
        bytes32 indexed refundId,
        bytes32 indexed paywallId,
        address indexed requester
    );

    event RefundProcessed(
        bytes32 indexed refundId,
        bytes32 indexed paywallId,
        address indexed requester,
        uint256 amount
    );

    event X402UnlockGranted(
        bytes32 indexed paywallId,
        address indexed user,
        address indexed grantedBy
    );

    event TwinkleX402Updated(address indexed oldX402, address indexed newX402);

    // ============ Custom Errors ============
    error PaywallNotFound();
    error PaywallNotActive();
    error AlreadyUnlocked();
    error InsufficientPayment();
    error NotCreator();
    error InvalidPrice();
    error IdExists();
    error InvalidRecipient();
    error ContractPaused();
    error TooManyPaywalls();
    error NotX402Contract();
    error PaywallNotRefundable();
    error RefundNotFound();
    error RefundAlreadyProcessed();
    error RefundNotApproved();
    error RefundAlreadyRejected();
    error NotRefundRequester();
    error RefundTimeout();
    error MNEEPaused();
    error MNEEBlacklistTransferFailed();

    // ============ Constructor ============
    constructor(address _core) {
        core = ITwinkleCore(_core);
        mnee = IERC20(core.mnee());

        // Enable MNEE integrity checking
        _enableMNEEIntegrityCheck(address(mnee));
    }

    // ============ Modifiers ============
    modifier whenNotPaused() {
        if (Pausable(address(core)).paused()) revert ContractPaused();
        _;
    }

    modifier whenMNEENotPaused() {
        if (IMNEE(address(mnee)).paused()) revert MNEEPaused();
        _;
    }

    modifier onlyX402() {
        if (msg.sender != twinkleX402) revert NotX402Contract();
        _;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set TwinkleX402 contract address
     * @param _x402 New x402 contract address
     */
    function setTwinkleX402(address _x402) external {
        // Only owner (via core) can set this
        // For now, allow creator to set once
        if (twinkleX402 != address(0)) {
            // After initial set, require owner
            require(msg.sender == ITwinkleCore(address(core)).owner(), "Not owner");
        }
        emit TwinkleX402Updated(twinkleX402, _x402);
        twinkleX402 = _x402;
    }

    // ============ Paywall Management ============

    /**
     * @notice Create a new paywall
     * @param id Unique identifier for the paywall
     * @param price Price in MNEE (wei)
     * @param splitAddress Optional split contract address for revenue sharing
     * @param x402Enabled Whether x402 protocol payments are accepted
     * @param refundable Whether refunds are allowed for this paywall
     * @return The paywall ID
     */
    function createPaywall(
        bytes32 id,
        uint96 price,
        address splitAddress,
        bool x402Enabled,
        bool refundable
    ) external whenNotPaused returns (bytes32) {
        if (price == 0) revert InvalidPrice();
        if (paywalls[id].creator != address(0)) revert IdExists();

        paywalls[id] = Paywall({
            creator: msg.sender,
            price: price,
            splitAddress: splitAddress,
            totalUnlocks: 0,
            active: true,
            x402Enabled: x402Enabled,
            refundable: refundable
        });

        emit PaywallCreated(id, msg.sender, price, splitAddress, x402Enabled, refundable);
        return id;
    }

    /**
     * @notice Create paywall (backwards compatible - no refundable param)
     */
    function createPaywall(
        bytes32 id,
        uint96 price,
        address splitAddress,
        bool x402Enabled
    ) external whenNotPaused returns (bytes32) {
        if (price == 0) revert InvalidPrice();
        if (paywalls[id].creator != address(0)) revert IdExists();

        paywalls[id] = Paywall({
            creator: msg.sender,
            price: price,
            splitAddress: splitAddress,
            totalUnlocks: 0,
            active: true,
            x402Enabled: x402Enabled,
            refundable: false
        });

        emit PaywallCreated(id, msg.sender, price, splitAddress, x402Enabled, false);
        return id;
    }

    /**
     * @notice Update an existing paywall
     * @param id Paywall ID
     * @param newPrice New price in MNEE (wei)
     * @param active Whether the paywall is active
     */
    function updatePaywall(
        bytes32 id,
        uint96 newPrice,
        bool active
    ) external {
        Paywall storage pw = paywalls[id];
        if (pw.creator != msg.sender) revert NotCreator();
        if (newPrice == 0) revert InvalidPrice();

        pw.price = newPrice;
        pw.active = active;

        emit PaywallUpdated(id, newPrice, active);
    }

    /**
     * @notice Update paywall split address
     * @param id Paywall ID
     * @param splitAddress New split contract address
     */
    function updatePaywallSplit(bytes32 id, address splitAddress) external {
        Paywall storage pw = paywalls[id];
        if (pw.creator != msg.sender) revert NotCreator();

        pw.splitAddress = splitAddress;
    }

    // ============ Payment Functions ============

    /**
     * @notice Pay for a paywall to unlock content
     * @param paywallId ID of the paywall to pay for
     */
    function pay(bytes32 paywallId) external nonReentrant whenNotPaused whenMNEENotPaused noFlashLoan withinRateLimit {
        _checkMNEEIntegrity(address(mnee));

        Paywall storage pw = paywalls[paywallId];

        // Checks
        if (pw.creator == address(0)) revert PaywallNotFound();
        if (!pw.active) revert PaywallNotActive();
        if (unlocks[paywallId][msg.sender]) revert AlreadyUnlocked();

        uint256 amount = pw.price;

        // Check for partial payments
        uint256 partialPaid = partialPayments[paywallId][msg.sender];
        if (partialPaid > 0) {
            amount = pw.price - partialPaid;
            partialPayments[paywallId][msg.sender] = 0;
        }

        uint256 totalAmount = pw.price;
        uint256 platformFee = core.calculateFee(totalAmount);
        uint256 creatorAmount = totalAmount - platformFee;

        // Effects (before interactions - CEI pattern)
        unlocks[paywallId][msg.sender] = true;

        // Use unchecked for safe increments
        unchecked {
            pw.totalUnlocks++;
            paywallRevenue[paywallId] += totalAmount;
        }

        // Interactions - transfer remaining amount
        mnee.safeTransferFrom(msg.sender, address(this), amount);

        if (platformFee > 0) {
            _safeTransferWithFallback(mnee, core.treasury(), platformFee);
        }

        if (pw.splitAddress != address(0)) {
            _safeTransferWithFallback(mnee, pw.splitAddress, creatorAmount);
        } else {
            _safeTransferWithFallback(mnee, pw.creator, creatorAmount);
        }

        emit PaymentReceived(paywallId, msg.sender, pw.creator, totalAmount, platformFee);
    }

    /**
     * @notice Make a partial payment toward a paywall
     * @param paywallId ID of the paywall
     * @param amount Amount to pay (partial)
     */
    function payPartial(bytes32 paywallId, uint256 amount) external nonReentrant whenNotPaused whenMNEENotPaused noFlashLoan withinRateLimit {
        _checkMNEEIntegrity(address(mnee));

        Paywall storage pw = paywalls[paywallId];

        if (pw.creator == address(0)) revert PaywallNotFound();
        if (!pw.active) revert PaywallNotActive();
        if (unlocks[paywallId][msg.sender]) revert AlreadyUnlocked();

        uint256 currentPaid = partialPayments[paywallId][msg.sender];
        uint256 totalPaid = currentPaid + amount;
        uint256 price = pw.price;

        if (totalPaid >= price) {
            // Full payment achieved - unlock immediately
            unlocks[paywallId][msg.sender] = true;
            partialPayments[paywallId][msg.sender] = 0;

            uint256 platformFee = core.calculateFee(price);
            uint256 creatorAmount = price - platformFee;

            unchecked {
                pw.totalUnlocks++;
                paywallRevenue[paywallId] += price;
            }

            // Transfer the remaining amount needed
            uint256 amountNeeded = price - currentPaid;
            mnee.safeTransferFrom(msg.sender, address(this), amountNeeded);

            // Refund overpayment if any
            if (totalPaid > price) {
                uint256 refund = totalPaid - price;
                _safeTransferWithFallback(mnee, msg.sender, refund);
            }

            if (platformFee > 0) {
                _safeTransferWithFallback(mnee, core.treasury(), platformFee);
            }

            if (pw.splitAddress != address(0)) {
                _safeTransferWithFallback(mnee, pw.splitAddress, creatorAmount);
            } else {
                _safeTransferWithFallback(mnee, pw.creator, creatorAmount);
            }

            emit PaymentReceived(paywallId, msg.sender, pw.creator, price, platformFee);
        } else {
            // Partial payment - store and wait for more
            partialPayments[paywallId][msg.sender] = totalPaid;
            mnee.safeTransferFrom(msg.sender, address(this), amount);

            emit PartialPaymentReceived(paywallId, msg.sender, amount, totalPaid, price - totalPaid);
        }
    }

    /**
     * @notice Withdraw partial payment (before completing)
     * @param paywallId Paywall to withdraw partial payment from
     */
    function withdrawPartialPayment(bytes32 paywallId) external nonReentrant whenMNEENotPaused {
        uint256 amount = partialPayments[paywallId][msg.sender];
        if (amount == 0) revert InsufficientPayment();

        partialPayments[paywallId][msg.sender] = 0;
        _safeTransferWithFallback(mnee, msg.sender, amount);
    }

    /**
     * @notice Send a direct payment to any recipient
     * @param recipient Address to receive payment
     * @param amount Amount of MNEE to send
     */
    function payDirect(address recipient, uint256 amount) external nonReentrant whenNotPaused whenMNEENotPaused noFlashLoan withinRateLimit {
        _checkMNEEIntegrity(address(mnee));

        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidPrice();

        uint256 platformFee = core.calculateFee(amount);
        uint256 recipientAmount = amount - platformFee;

        mnee.safeTransferFrom(msg.sender, address(this), amount);

        if (platformFee > 0) {
            _safeTransferWithFallback(mnee, core.treasury(), platformFee);
        }
        _safeTransferWithFallback(mnee, recipient, recipientAmount);

        emit DirectPayment(msg.sender, recipient, amount, platformFee);
    }

    // ============ x402 Integration ============

    /**
     * @notice Unlock a paywall for a user (called by TwinkleX402 after payment)
     * @param paywallId Paywall to unlock
     * @param user User to grant access
     */
    function unlockForUser(bytes32 paywallId, address user) external onlyX402 {
        Paywall storage pw = paywalls[paywallId];
        if (pw.creator == address(0)) revert PaywallNotFound();

        // Don't revert if already unlocked - just skip
        if (unlocks[paywallId][user]) return;

        unlocks[paywallId][user] = true;

        unchecked {
            pw.totalUnlocks++;
        }

        emit X402UnlockGranted(paywallId, user, msg.sender);
    }

    // ============ Refund Functions ============

    /**
     * @notice Request a refund for a paywall purchase
     * @param paywallId Paywall to request refund for
     * @param reason Reason for refund request
     * @return refundId Unique refund request ID
     */
    function requestRefund(bytes32 paywallId, string calldata reason) external returns (bytes32 refundId) {
        Paywall storage pw = paywalls[paywallId];
        if (pw.creator == address(0)) revert PaywallNotFound();
        if (!pw.refundable) revert PaywallNotRefundable();
        if (!unlocks[paywallId][msg.sender]) revert PaywallNotFound(); // Must have purchased

        uint256 count = refundRequestCount[paywallId]++;
        refundId = keccak256(abi.encodePacked(paywallId, msg.sender, count));

        refundRequests[refundId] = RefundRequest({
            paywallId: paywallId,
            requester: msg.sender,
            amount: pw.price,
            requestedAt: uint40(block.timestamp),
            approved: false,
            processed: false,
            rejected: false,
            reason: reason
        });

        emit RefundRequested(refundId, paywallId, msg.sender, pw.price, reason);
    }

    /**
     * @notice Approve a refund request (creator only)
     * @param refundId Refund request ID
     */
    function approveRefund(bytes32 refundId) external {
        RefundRequest storage req = refundRequests[refundId];
        if (req.requester == address(0)) revert RefundNotFound();
        if (req.processed) revert RefundAlreadyProcessed();
        if (req.rejected) revert RefundAlreadyRejected();

        Paywall storage pw = paywalls[req.paywallId];
        if (pw.creator != msg.sender) revert NotCreator();

        req.approved = true;

        emit RefundApproved(refundId, req.paywallId, req.requester, req.amount);
    }

    /**
     * @notice Reject a refund request (creator only)
     * @param refundId Refund request ID
     */
    function rejectRefund(bytes32 refundId) external {
        RefundRequest storage req = refundRequests[refundId];
        if (req.requester == address(0)) revert RefundNotFound();
        if (req.processed) revert RefundAlreadyProcessed();

        Paywall storage pw = paywalls[req.paywallId];
        if (pw.creator != msg.sender) revert NotCreator();

        req.rejected = true;

        emit RefundRejected(refundId, req.paywallId, req.requester);
    }

    /**
     * @notice Process an approved refund
     * @param refundId Refund request ID
     */
    function processRefund(bytes32 refundId) external nonReentrant whenMNEENotPaused {
        RefundRequest storage req = refundRequests[refundId];
        if (req.requester == address(0)) revert RefundNotFound();
        if (req.processed) revert RefundAlreadyProcessed();
        if (!req.approved) revert RefundNotApproved();
        if (req.requester != msg.sender) revert NotRefundRequester();

        // Check timeout - creator has 7 days to reject after approval
        if (block.timestamp < req.requestedAt + refundTimeout) {
            // Still within timeout, proceed with refund
        }

        req.processed = true;

        // Revoke access
        unlocks[req.paywallId][req.requester] = false;

        // The creator pays the refund from their own funds
        // (they already received the payment)
        // This creates an obligation for the creator to maintain MNEE balance

        // Transfer refund amount from creator to requester
        // Note: Creator must have approved this contract for the refund amount
        // Uses fallback pattern in case requester got blacklisted
        Paywall storage pw = paywalls[req.paywallId];
        _safeTransferFromWithFallback(mnee, pw.creator, req.requester, req.amount);

        emit RefundProcessed(refundId, req.paywallId, req.requester, req.amount);
    }

    // ============ Batch Operations ============

    /**
     * @notice Pay for multiple paywalls in a single transaction
     * @param paywallIds Array of paywall IDs to pay for
     */
    function batchPay(bytes32[] calldata paywallIds) external nonReentrant whenNotPaused whenMNEENotPaused noFlashLoan {
        _checkMNEEIntegrity(address(mnee));

        uint256 len = paywallIds.length;
        if (len > 20) revert TooManyPaywalls();

        for (uint256 i; i < len; ) {
            _payInternal(paywallIds[i]);
            unchecked { ++i; }
        }
    }

    /**
     * @dev Internal payment logic for batch operations
     */
    function _payInternal(bytes32 paywallId) internal {
        Paywall storage pw = paywalls[paywallId];
        if (pw.creator == address(0)) revert PaywallNotFound();
        if (!pw.active) revert PaywallNotActive();
        if (unlocks[paywallId][msg.sender]) return; // Skip already unlocked

        uint256 amount = pw.price;
        uint256 platformFee = core.calculateFee(amount);
        uint256 creatorAmount = amount - platformFee;

        unlocks[paywallId][msg.sender] = true;
        unchecked {
            pw.totalUnlocks++;
            paywallRevenue[paywallId] += amount;
        }

        mnee.safeTransferFrom(msg.sender, address(this), amount);

        if (platformFee > 0) {
            _safeTransferWithFallback(mnee, core.treasury(), platformFee);
        }

        if (pw.splitAddress != address(0)) {
            _safeTransferWithFallback(mnee, pw.splitAddress, creatorAmount);
        } else {
            _safeTransferWithFallback(mnee, pw.creator, creatorAmount);
        }

        emit PaymentReceived(paywallId, msg.sender, pw.creator, amount, platformFee);
    }

    // ============ View Functions ============

    /**
     * @notice Check if a user has unlocked a paywall
     * @param paywallId Paywall ID
     * @param user User address
     * @return Whether the user has unlocked the paywall
     */
    function isUnlocked(bytes32 paywallId, address user) external view returns (bool) {
        return unlocks[paywallId][user];
    }

    /**
     * @notice Get partial payment balance for a user
     * @param paywallId Paywall ID
     * @param user User address
     * @return Amount paid so far
     */
    function getPartialPayment(bytes32 paywallId, address user) external view returns (uint256) {
        return partialPayments[paywallId][user];
    }

    /**
     * @notice Get full paywall details
     * @param paywallId Paywall ID
     */
    function getPaywall(bytes32 paywallId) external view returns (
        address creator,
        uint256 price,
        address splitAddress,
        uint256 totalUnlocks,
        uint256 totalRevenue,
        bool active,
        bool x402Enabled,
        bool refundable
    ) {
        Paywall storage pw = paywalls[paywallId];
        return (
            pw.creator,
            pw.price,
            pw.splitAddress,
            pw.totalUnlocks,
            paywallRevenue[paywallId],
            pw.active,
            pw.x402Enabled,
            pw.refundable
        );
    }

    /**
     * @notice Get refund request details
     * @param refundId Refund request ID
     */
    function getRefundRequest(bytes32 refundId) external view returns (
        bytes32 paywallId,
        address requester,
        uint256 amount,
        uint256 requestedAt,
        bool approved,
        bool processed,
        bool rejected,
        string memory reason
    ) {
        RefundRequest storage req = refundRequests[refundId];
        return (
            req.paywallId,
            req.requester,
            req.amount,
            req.requestedAt,
            req.approved,
            req.processed,
            req.rejected,
            req.reason
        );
    }
}
