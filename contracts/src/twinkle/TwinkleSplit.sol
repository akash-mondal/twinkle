// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/ITwinkleCore.sol";
import "./base/TwinkleDefensive.sol";

/**
 * @title TwinkleSplit
 * @notice Revenue distribution to multiple recipients
 * @dev V5 - Supports automatic distribution, batch operations, and defensive patterns
 *
 * Key features:
 * - Revenue splits with up to 50 recipients
 * - Mutable and immutable splits
 * - Push distribution with pull fallback for failed transfers
 * - Batch distribution for multiple splits
 * - Defensive patterns: flash loan protection, rate limiting, backup recipients
 * - MNEE upgrade detection
 */
contract TwinkleSplit is ReentrancyGuard, TwinkleDefensive {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    uint256 public constant PERCENTAGE_SCALE = 1e6; // 100% = 1_000_000
    uint256 public constant MIN_WITHDRAWAL = 1e15; // 0.001 MNEE
    uint256 public constant MAX_BATCH_SIZE = 10; // Max splits per batch distribution

    // ============ Optimized Struct (2 slots) ============
    struct Split {
        address creator;          // slot 0: 20 bytes
        uint48 totalDistributed;  // slot 0: 6 bytes (scaled, enough for practical use)
        bool mutable_;            // slot 0: 1 byte
        bool active;              // slot 0: 1 byte
        bytes32 recipientsHash;   // slot 1: 32 bytes
    }

    // ============ Immutables ============
    ITwinkleCore public immutable core;
    IERC20 public immutable mnee;

    // ============ Storage ============
    mapping(bytes32 => Split) public splits;
    mapping(bytes32 => mapping(address => uint256)) public pendingWithdrawals;
    mapping(bytes32 => uint256) public splitBalance; // Track balance per split

    /// @notice Total pending withdrawals per split (for accounting)
    mapping(bytes32 => uint256) public totalPendingWithdrawals;

    /// @notice Distribution count per user for rate limiting
    mapping(address => uint256) public distributionCount;

    /// @notice Last distribution timestamp per split (for flash loan protection)
    mapping(bytes32 => uint256) public lastDistributionBlock;

    // ============ Events ============
    event SplitCreated(
        bytes32 indexed id,
        address indexed creator,
        address[] recipients,
        uint256[] percentages,
        bool mutable_
    );

    event SplitUpdated(
        bytes32 indexed id,
        address[] recipients,
        uint256[] percentages
    );

    event SplitDeactivated(bytes32 indexed id, address indexed by);
    event SplitReactivated(bytes32 indexed id, address indexed by);

    event Distributed(
        bytes32 indexed splitId,
        uint256 amount,
        uint256 recipientCount,
        uint256 platformFee
    );

    event Withdrawn(
        bytes32 indexed splitId,
        address indexed recipient,
        uint256 amount
    );

    event DistributionFailed(
        bytes32 indexed splitId,
        address indexed recipient,
        uint256 amount,
        bool sentToBackup
    );

    event FundsReceived(
        bytes32 indexed splitId,
        address indexed from,
        uint256 amount
    );

    event BatchDistributed(
        uint256 indexed batchId,
        uint256 splitCount,
        uint256 totalAmount
    );

    // ============ Errors ============
    error SplitNotFound();
    error SplitNotActive();
    error InvalidPercentages();
    error RecipientMismatch();
    error NothingToWithdraw();
    error BelowMinimum();
    error IdExists();
    error TooManyRecipients();
    error NotCreator();
    error SplitImmutable();
    error ContractPaused();
    error BatchTooLarge();
    error DistributionTooSoon();
    error ZeroRecipients();
    error ZeroAddress();

    // ============ Constructor ============
    constructor(address _core) {
        if (_core == address(0)) revert ZeroAddress();
        core = ITwinkleCore(_core);
        mnee = IERC20(core.mnee());
    }

    // ============ Modifiers ============
    modifier whenNotPaused() {
        if (Pausable(address(core)).paused()) revert ContractPaused();
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == core.owner(), "Not owner");
        _;
    }

    // ============ Admin Functions ============

    /**
     * @notice Enable MNEE upgrade detection
     * @dev Call after deployment to start monitoring for proxy upgrades
     */
    function enableMNEEIntegrityCheck() external onlyOwner {
        _enableMNEEIntegrityCheck(address(mnee));
    }

    /**
     * @notice Disable MNEE upgrade detection
     */
    function disableMNEEIntegrityCheck() external onlyOwner {
        _disableMNEEIntegrityCheck();
    }

    /**
     * @notice Set withdrawal limits
     * @param _maxSingle Maximum single withdrawal (0 = unlimited)
     * @param _dailyLimit Maximum daily withdrawals per user (0 = unlimited)
     */
    function setWithdrawalLimits(uint256 _maxSingle, uint256 _dailyLimit) external onlyOwner {
        _setWithdrawalLimits(_maxSingle, _dailyLimit);
    }

    // ============ Split Management ============

    /**
     * @notice Create a new revenue split
     * @param id Unique identifier for the split
     * @param recipients Array of recipient addresses
     * @param percentages Array of percentages (must sum to PERCENTAGE_SCALE)
     * @param mutable_ Whether the split can be modified later
     * @return The split ID
     */
    function createSplit(
        bytes32 id,
        address[] calldata recipients,
        uint256[] calldata percentages,
        bool mutable_
    ) external whenNotPaused returns (bytes32) {
        if (splits[id].creator != address(0)) revert IdExists();
        if (recipients.length != percentages.length) revert RecipientMismatch();
        if (recipients.length == 0) revert ZeroRecipients();
        if (recipients.length > 50) revert TooManyRecipients();

        // Validate percentages sum to 100% and no zero addresses
        uint256 total;
        for (uint256 i; i < percentages.length; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            total += percentages[i];
            unchecked { ++i; }
        }
        if (total != PERCENTAGE_SCALE) revert InvalidPercentages();

        // Store hash of recipients and percentages for verification
        bytes32 recipientsHash = keccak256(abi.encode(recipients, percentages));

        splits[id] = Split({
            creator: msg.sender,
            totalDistributed: 0,
            mutable_: mutable_,
            active: true,
            recipientsHash: recipientsHash
        });

        emit SplitCreated(id, msg.sender, recipients, percentages, mutable_);
        return id;
    }

    /**
     * @notice Update a mutable split's recipients and percentages
     * @param id Split ID
     * @param recipients New array of recipient addresses
     * @param percentages New array of percentages
     */
    function updateSplit(
        bytes32 id,
        address[] calldata recipients,
        uint256[] calldata percentages
    ) external {
        Split storage split = splits[id];
        if (split.creator == address(0)) revert SplitNotFound();
        if (split.creator != msg.sender) revert NotCreator();
        if (!split.mutable_) revert SplitImmutable();
        if (recipients.length != percentages.length) revert RecipientMismatch();
        if (recipients.length == 0) revert ZeroRecipients();
        if (recipients.length > 50) revert TooManyRecipients();

        // Validate percentages and addresses
        uint256 total;
        for (uint256 i; i < percentages.length; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            total += percentages[i];
            unchecked { ++i; }
        }
        if (total != PERCENTAGE_SCALE) revert InvalidPercentages();

        split.recipientsHash = keccak256(abi.encode(recipients, percentages));

        emit SplitUpdated(id, recipients, percentages);
    }

    /**
     * @notice Deactivate a split
     * @param id Split ID
     * @dev Only creator can deactivate. Funds can still be withdrawn.
     */
    function deactivateSplit(bytes32 id) external {
        Split storage split = splits[id];
        if (split.creator == address(0)) revert SplitNotFound();
        if (split.creator != msg.sender) revert NotCreator();

        split.active = false;
        emit SplitDeactivated(id, msg.sender);
    }

    /**
     * @notice Reactivate a split
     * @param id Split ID
     */
    function reactivateSplit(bytes32 id) external {
        Split storage split = splits[id];
        if (split.creator == address(0)) revert SplitNotFound();
        if (split.creator != msg.sender) revert NotCreator();

        split.active = true;
        emit SplitReactivated(id, msg.sender);
    }

    // ============ Distribution Functions ============

    /**
     * @notice Distribute the split's balance to all recipients
     * @param splitId Split ID
     * @param recipients Array of recipient addresses (must match stored hash)
     * @param percentages Array of percentages (must match stored hash)
     */
    function distribute(
        bytes32 splitId,
        address[] calldata recipients,
        uint256[] calldata percentages
    ) external nonReentrant whenNotPaused noFlashLoan withinRateLimit {
        _checkMNEEIntegrity(address(mnee));
        _distribute(splitId, recipients, percentages);
    }

    /**
     * @notice Batch distribute multiple splits
     * @param splitIds Array of split IDs
     * @param recipientsArrays Array of recipient arrays
     * @param percentagesArrays Array of percentage arrays
     */
    function batchDistribute(
        bytes32[] calldata splitIds,
        address[][] calldata recipientsArrays,
        uint256[][] calldata percentagesArrays
    ) external nonReentrant whenNotPaused noFlashLoan withinRateLimit {
        if (splitIds.length > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (splitIds.length != recipientsArrays.length) revert RecipientMismatch();
        if (splitIds.length != percentagesArrays.length) revert RecipientMismatch();

        _checkMNEEIntegrity(address(mnee));

        uint256 totalDistributed;
        for (uint256 i; i < splitIds.length; ) {
            totalDistributed += _distribute(
                splitIds[i],
                recipientsArrays[i],
                percentagesArrays[i]
            );
            unchecked { ++i; }
        }

        emit BatchDistributed(
            uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))),
            splitIds.length,
            totalDistributed
        );
    }

    /**
     * @notice Internal distribution logic
     */
    function _distribute(
        bytes32 splitId,
        address[] calldata recipients,
        uint256[] calldata percentages
    ) internal returns (uint256 distributed) {
        Split storage split = splits[splitId];
        if (split.creator == address(0)) revert SplitNotFound();
        if (!split.active) revert SplitNotActive();

        // Flash loan protection per split
        if (lastDistributionBlock[splitId] == block.number) revert DistributionTooSoon();
        lastDistributionBlock[splitId] = block.number;

        // Verify hash matches
        bytes32 recipientsHash = keccak256(abi.encode(recipients, percentages));
        if (recipientsHash != split.recipientsHash) revert RecipientMismatch();

        uint256 balance = splitBalance[splitId];
        if (balance == 0) return 0;

        // Reset balance before distribution (CEI pattern)
        splitBalance[splitId] = 0;

        // Platform fee
        uint256 platformFee = core.calculateFee(balance);
        if (platformFee > 0) {
            mnee.safeTransfer(core.treasury(), platformFee);
            balance -= platformFee;
        }

        distributed = balance;

        // Distribute with bounded loop
        uint256 len = recipients.length;
        for (uint256 i; i < len; ) {
            uint256 amount = (balance * percentages[i]) / PERCENTAGE_SCALE;

            if (amount > 0) {
                _distributeToRecipient(splitId, recipients[i], amount);
            }

            unchecked { ++i; }
        }

        // Update total distributed (scaled down for storage)
        unchecked {
            split.totalDistributed += uint48(balance / 1e12); // Scale down by 1e12
        }

        emit Distributed(splitId, balance, len, platformFee);
    }

    /**
     * @notice Distribute to a single recipient with fallback
     */
    function _distributeToRecipient(
        bytes32 splitId,
        address recipient,
        uint256 amount
    ) internal {
        // Try with fallback using TwinkleDefensive pattern
        bool success = _safeTransferWithFallback(mnee, recipient, amount);

        if (!success) {
            // Both primary and backup failed, add to pending
            pendingWithdrawals[splitId][recipient] += amount;
            totalPendingWithdrawals[splitId] += amount;
            emit DistributionFailed(splitId, recipient, amount, false);
        }
    }

    /**
     * @notice External wrapper for safeTransfer (used for try/catch)
     * @dev Only callable by this contract
     */
    function safeTransferExternal(address to, uint256 amount) external {
        require(msg.sender == address(this), "Only self");
        mnee.safeTransfer(to, amount);
    }

    /**
     * @notice Withdraw pending balance from failed distributions
     * @param splitId Split ID
     */
    function withdraw(bytes32 splitId)
        external
        nonReentrant
        withinWithdrawalLimits(pendingWithdrawals[splitId][msg.sender])
    {
        uint256 amount = pendingWithdrawals[splitId][msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        if (amount < MIN_WITHDRAWAL) revert BelowMinimum();

        // CEI pattern
        pendingWithdrawals[splitId][msg.sender] = 0;
        totalPendingWithdrawals[splitId] -= amount;

        // Use safe transfer with fallback
        _safeTransferWithFallback(mnee, msg.sender, amount);

        emit Withdrawn(splitId, msg.sender, amount);
    }

    /**
     * @notice Withdraw from multiple splits at once
     * @param splitIds Array of split IDs
     */
    function batchWithdraw(bytes32[] calldata splitIds) external nonReentrant {
        uint256 totalAmount;

        for (uint256 i; i < splitIds.length; ) {
            uint256 amount = pendingWithdrawals[splitIds[i]][msg.sender];
            if (amount >= MIN_WITHDRAWAL) {
                pendingWithdrawals[splitIds[i]][msg.sender] = 0;
                totalPendingWithdrawals[splitIds[i]] -= amount;
                totalAmount += amount;
                emit Withdrawn(splitIds[i], msg.sender, amount);
            }
            unchecked { ++i; }
        }

        if (totalAmount == 0) revert NothingToWithdraw();

        // Check withdrawal limits
        if (maxSingleWithdrawal != 0 && totalAmount > maxSingleWithdrawal) {
            revert WithdrawalLimitExceeded(totalAmount, maxSingleWithdrawal);
        }

        _safeTransferWithFallback(mnee, msg.sender, totalAmount);
    }

    /**
     * @notice Receive funds for a split
     * @param splitId Split ID to credit
     * @param amount Amount of MNEE to add
     */
    function receiveFunds(bytes32 splitId, uint256 amount) external {
        if (splits[splitId].creator == address(0)) revert SplitNotFound();

        mnee.safeTransferFrom(msg.sender, address(this), amount);
        splitBalance[splitId] += amount;

        emit FundsReceived(splitId, msg.sender, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get split details
     * @param splitId Split ID
     * @return creator Creator address
     * @return totalDistributed Total amount distributed (scaled)
     * @return mutable_ Whether split is mutable
     * @return active Whether split is active
     * @return recipientsHash Hash of recipients and percentages
     * @return balance Current balance available for distribution
     * @return pendingTotal Total pending withdrawals
     */
    function getSplit(bytes32 splitId) external view returns (
        address creator,
        uint256 totalDistributed,
        bool mutable_,
        bool active,
        bytes32 recipientsHash,
        uint256 balance,
        uint256 pendingTotal
    ) {
        Split storage split = splits[splitId];
        return (
            split.creator,
            uint256(split.totalDistributed) * 1e12, // Scale back up
            split.mutable_,
            split.active,
            split.recipientsHash,
            splitBalance[splitId],
            totalPendingWithdrawals[splitId]
        );
    }

    /**
     * @notice Get pending withdrawal amount for a user
     * @param splitId Split ID
     * @param user User address
     * @return Pending amount
     */
    function getPendingWithdrawal(bytes32 splitId, address user) external view returns (uint256) {
        return pendingWithdrawals[splitId][user];
    }

    /**
     * @notice Get total pending withdrawals across multiple splits for a user
     * @param splitIds Array of split IDs
     * @param user User address
     * @return total Total pending amount
     */
    function getTotalPendingWithdrawals(
        bytes32[] calldata splitIds,
        address user
    ) external view returns (uint256 total) {
        for (uint256 i; i < splitIds.length; ) {
            total += pendingWithdrawals[splitIds[i]][user];
            unchecked { ++i; }
        }
    }

    /**
     * @notice Verify recipients and percentages match a split
     * @param splitId Split ID
     * @param recipients Array of recipient addresses
     * @param percentages Array of percentages
     * @return Whether the hash matches
     */
    function verifyRecipients(
        bytes32 splitId,
        address[] calldata recipients,
        uint256[] calldata percentages
    ) external view returns (bool) {
        bytes32 hash = keccak256(abi.encode(recipients, percentages));
        return splits[splitId].recipientsHash == hash;
    }

    /**
     * @notice Check if a split exists and is active
     * @param splitId Split ID
     * @return exists Whether the split exists
     * @return isActive Whether the split is active
     */
    function isSplitActive(bytes32 splitId) external view returns (bool exists, bool isActive) {
        Split storage split = splits[splitId];
        exists = split.creator != address(0);
        isActive = split.active;
    }
}
