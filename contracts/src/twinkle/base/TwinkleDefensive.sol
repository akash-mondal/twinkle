// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TwinkleDefensive
 * @notice Shared defensive patterns for Twinkle Protocol contracts
 * @dev Provides MNEE-safe transfer patterns, flash loan protection,
 *      rate limiting, and upgrade detection for TransparentUpgradeableProxy tokens
 *
 * Key security features:
 * 1. MNEE upgrade detection - pause if proxy implementation changes
 * 2. Backup recipients - fallback addresses for failed transfers (blacklist-safe)
 * 3. Flash loan protection - multi-block delay on critical operations
 * 4. Rate limiting - per-address daily transfer limits
 * 5. Withdrawal limits - maximum single and daily withdrawal caps
 * 6. Safe transfer with fallback - try-catch pattern for blacklist handling
 */
abstract contract TwinkleDefensive {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Minimum blocks between user actions to prevent flash loan attacks
    uint256 public constant MULTI_BLOCK_DELAY = 1;

    /// @notice Maximum transfers per address per day
    uint256 public constant MAX_DAILY_TRANSFERS = 100;

    /// @notice Seconds in a day for rate limit reset
    uint256 private constant SECONDS_PER_DAY = 86400;

    // ============ Storage ============

    /// @notice Stored code hash of MNEE implementation for upgrade detection
    bytes32 private _mneeCodeHash;

    /// @notice Whether MNEE integrity check is enabled
    bool public mneeIntegrityCheckEnabled;

    /// @notice Backup recipient addresses for failed transfers
    /// @dev If transfer to primary fails, try backup. Protects against blacklisting.
    mapping(address => address) public backupRecipients;

    /// @notice Last block number when user took a critical action
    mapping(address => uint256) private _lastActionBlock;

    /// @notice Daily transfer count per user for rate limiting
    mapping(address => uint256) public dailyTransferCount;

    /// @notice Timestamp when daily transfer count resets for user
    mapping(address => uint256) public dailyTransferResetTime;

    /// @notice Maximum amount for a single withdrawal (0 = unlimited)
    uint256 public maxSingleWithdrawal;

    /// @notice Maximum total withdrawals per day per user (0 = unlimited)
    uint256 public dailyWithdrawalLimit;

    /// @notice Daily withdrawal total per user
    mapping(address => uint256) public dailyWithdrawalTotal;

    /// @notice Timestamp when daily withdrawal total resets for user
    mapping(address => uint256) public dailyWithdrawalResetTime;

    // ============ Events ============

    event BackupRecipientSet(address indexed user, address indexed backup);
    event TransferFallbackUsed(address indexed primary, address indexed backup, uint256 amount);
    event MNEEIntegrityCheckEnabled(bytes32 codeHash);
    event MNEEIntegrityCheckDisabled();
    event WithdrawalLimitsUpdated(uint256 maxSingle, uint256 dailyLimit);
    event RateLimitHit(address indexed user, uint256 count);
    event FlashLoanProtectionTriggered(address indexed user, uint256 lastBlock, uint256 currentBlock);

    // ============ Errors ============

    /// @notice MNEE proxy implementation was upgraded - operations paused for safety
    error MNEEUpgradeDetected(bytes32 expected, bytes32 actual);

    /// @notice User attempted action in same or adjacent block (flash loan protection)
    error FlashLoanProtection(uint256 lastActionBlock, uint256 currentBlock);

    /// @notice User exceeded daily transfer limit
    error RateLimitExceeded();

    /// @notice Withdrawal amount exceeds single transaction limit
    error WithdrawalLimitExceeded(uint256 amount, uint256 limit);

    /// @notice Daily withdrawal limit exceeded
    error DailyWithdrawalLimitExceeded(uint256 requested, uint256 remaining);

    /// @notice Transfer failed to both primary and backup recipients
    error TransferFailed(address primary, address backup);

    /// @notice Cannot set backup recipient to zero address or self
    error InvalidBackupRecipient();

    // ============ Modifiers ============

    /**
     * @notice Prevents flash loan attacks by requiring multi-block delay
     * @dev Users must wait at least MULTI_BLOCK_DELAY blocks between critical actions
     */
    modifier noFlashLoan() {
        uint256 lastAction = _lastActionBlock[msg.sender];
        if (lastAction != 0 && block.number <= lastAction + MULTI_BLOCK_DELAY) {
            emit FlashLoanProtectionTriggered(msg.sender, lastAction, block.number);
            revert FlashLoanProtection(lastAction, block.number);
        }
        _lastActionBlock[msg.sender] = block.number;
        _;
    }

    /**
     * @notice Enforces daily transfer rate limits per user
     * @dev Resets counter after 24 hours from first transfer of the day
     */
    modifier withinRateLimit() {
        // Reset counter if day has passed
        if (block.timestamp > dailyTransferResetTime[msg.sender] + SECONDS_PER_DAY) {
            dailyTransferResetTime[msg.sender] = block.timestamp;
            dailyTransferCount[msg.sender] = 0;
        }

        if (dailyTransferCount[msg.sender] >= MAX_DAILY_TRANSFERS) {
            emit RateLimitHit(msg.sender, dailyTransferCount[msg.sender]);
            revert RateLimitExceeded();
        }

        unchecked {
            dailyTransferCount[msg.sender]++;
        }
        _;
    }

    /**
     * @notice Enforces withdrawal limits per transaction and per day
     * @param amount The withdrawal amount to check
     */
    modifier withinWithdrawalLimits(uint256 amount) {
        // Check single withdrawal limit
        if (maxSingleWithdrawal != 0 && amount > maxSingleWithdrawal) {
            revert WithdrawalLimitExceeded(amount, maxSingleWithdrawal);
        }

        // Check daily limit
        if (dailyWithdrawalLimit != 0) {
            // Reset if day has passed
            if (block.timestamp > dailyWithdrawalResetTime[msg.sender] + SECONDS_PER_DAY) {
                dailyWithdrawalResetTime[msg.sender] = block.timestamp;
                dailyWithdrawalTotal[msg.sender] = 0;
            }

            uint256 remaining = dailyWithdrawalLimit - dailyWithdrawalTotal[msg.sender];
            if (amount > remaining) {
                revert DailyWithdrawalLimitExceeded(amount, remaining);
            }

            dailyWithdrawalTotal[msg.sender] += amount;
        }
        _;
    }

    // ============ MNEE Integrity Functions ============

    /**
     * @notice Enable MNEE upgrade detection by storing current implementation code hash
     * @param mnee The MNEE token address
     * @dev Call this after deployment to start monitoring for proxy upgrades
     */
    function _enableMNEEIntegrityCheck(address mnee) internal {
        bytes32 codeHash = mnee.codehash;
        _mneeCodeHash = codeHash;
        mneeIntegrityCheckEnabled = true;
        emit MNEEIntegrityCheckEnabled(codeHash);
    }

    /**
     * @notice Disable MNEE upgrade detection
     * @dev Only call if intentionally allowing upgraded MNEE to be used
     */
    function _disableMNEEIntegrityCheck() internal {
        _mneeCodeHash = bytes32(0);
        mneeIntegrityCheckEnabled = false;
        emit MNEEIntegrityCheckDisabled();
    }

    /**
     * @notice Check if MNEE implementation has been upgraded
     * @param mnee The MNEE token address to check
     * @dev Reverts if code hash doesn't match stored hash
     */
    function _checkMNEEIntegrity(address mnee) internal view {
        if (!mneeIntegrityCheckEnabled) return;

        bytes32 currentHash = mnee.codehash;
        if (currentHash != _mneeCodeHash) {
            revert MNEEUpgradeDetected(_mneeCodeHash, currentHash);
        }
    }

    /**
     * @notice View function to check if MNEE has been upgraded
     * @param mnee The MNEE token address
     * @return upgraded True if implementation changed
     * @return expectedHash The expected code hash
     * @return actualHash The current code hash
     */
    function isMNEEUpgraded(address mnee) public view returns (
        bool upgraded,
        bytes32 expectedHash,
        bytes32 actualHash
    ) {
        expectedHash = _mneeCodeHash;
        actualHash = mnee.codehash;
        upgraded = mneeIntegrityCheckEnabled && (actualHash != expectedHash);
    }

    // ============ Backup Recipient Functions ============

    /**
     * @notice Set a backup recipient for failed transfers
     * @param backup The backup address to receive funds if primary transfer fails
     * @dev Protects against being blacklisted - funds go to backup instead
     */
    function setBackupRecipient(address backup) external {
        if (backup == address(0) || backup == msg.sender) {
            revert InvalidBackupRecipient();
        }
        backupRecipients[msg.sender] = backup;
        emit BackupRecipientSet(msg.sender, backup);
    }

    /**
     * @notice Clear backup recipient
     */
    function clearBackupRecipient() external {
        backupRecipients[msg.sender] = address(0);
        emit BackupRecipientSet(msg.sender, address(0));
    }

    // ============ Safe Transfer Functions ============

    /**
     * @notice Transfer tokens with fallback to backup recipient
     * @param token The ERC20 token to transfer
     * @param to Primary recipient address
     * @param amount Amount to transfer
     * @return success True if transfer succeeded to primary or backup
     * @dev Uses try-catch to handle blacklisted addresses gracefully
     */
    function _safeTransferWithFallback(
        IERC20 token,
        address to,
        uint256 amount
    ) internal returns (bool success) {
        address backup = backupRecipients[to];

        // Try primary recipient first
        try token.transfer(to, amount) returns (bool result) {
            if (result) return true;
        } catch {}

        // If primary failed and backup exists, try backup
        if (backup != address(0)) {
            try token.transfer(backup, amount) returns (bool result) {
                if (result) {
                    emit TransferFallbackUsed(to, backup, amount);
                    return true;
                }
            } catch {}
        }

        // Both failed
        revert TransferFailed(to, backup);
    }

    /**
     * @notice Transfer tokens from sender with fallback to backup recipient
     * @param token The ERC20 token to transfer
     * @param from Sender address
     * @param to Primary recipient address
     * @param amount Amount to transfer
     * @return success True if transfer succeeded
     */
    function _safeTransferFromWithFallback(
        IERC20 token,
        address from,
        address to,
        uint256 amount
    ) internal returns (bool success) {
        address backup = backupRecipients[to];

        // Try primary recipient first
        try token.transferFrom(from, to, amount) returns (bool result) {
            if (result) return true;
        } catch {}

        // If primary failed and backup exists, try backup
        if (backup != address(0)) {
            try token.transferFrom(from, backup, amount) returns (bool result) {
                if (result) {
                    emit TransferFallbackUsed(to, backup, amount);
                    return true;
                }
            } catch {}
        }

        // Both failed
        revert TransferFailed(to, backup);
    }

    // ============ Limit Configuration ============

    /**
     * @notice Set withdrawal limits (internal, to be called by owner)
     * @param _maxSingle Maximum single withdrawal (0 = unlimited)
     * @param _dailyLimit Maximum daily withdrawals per user (0 = unlimited)
     */
    function _setWithdrawalLimits(uint256 _maxSingle, uint256 _dailyLimit) internal {
        maxSingleWithdrawal = _maxSingle;
        dailyWithdrawalLimit = _dailyLimit;
        emit WithdrawalLimitsUpdated(_maxSingle, _dailyLimit);
    }

    // ============ View Functions ============

    /**
     * @notice Get remaining daily transfers for a user
     * @param user The user address
     * @return remaining Number of transfers remaining today
     */
    function getRemainingDailyTransfers(address user) external view returns (uint256 remaining) {
        // Check if reset needed
        if (block.timestamp > dailyTransferResetTime[user] + SECONDS_PER_DAY) {
            return MAX_DAILY_TRANSFERS;
        }

        uint256 used = dailyTransferCount[user];
        if (used >= MAX_DAILY_TRANSFERS) return 0;
        return MAX_DAILY_TRANSFERS - used;
    }

    /**
     * @notice Get remaining daily withdrawal amount for a user
     * @param user The user address
     * @return remaining Amount remaining for withdrawals today
     */
    function getRemainingDailyWithdrawal(address user) external view returns (uint256 remaining) {
        if (dailyWithdrawalLimit == 0) return type(uint256).max;

        // Check if reset needed
        if (block.timestamp > dailyWithdrawalResetTime[user] + SECONDS_PER_DAY) {
            return dailyWithdrawalLimit;
        }

        uint256 used = dailyWithdrawalTotal[user];
        if (used >= dailyWithdrawalLimit) return 0;
        return dailyWithdrawalLimit - used;
    }

    /**
     * @notice Check if user can perform action (flash loan check)
     * @param user The user address
     * @return canAct True if enough blocks have passed since last action
     */
    function canPerformAction(address user) external view returns (bool canAct) {
        uint256 lastAction = _lastActionBlock[user];
        if (lastAction == 0) return true;
        return block.number > lastAction + MULTI_BLOCK_DELAY;
    }
}
