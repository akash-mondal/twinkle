// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockSablier
 * @notice Mock implementation of Sablier V3 Lockup for testing
 * @dev Exactly matches ISablierLockup interface from TwinkleEscrow.sol
 *      Simulates stream creation and withdrawal without the token allowlist requirement
 *
 * Interface compatibility:
 * - CreateWithDurations: Matches Sablier V3 exactly (sender, recipient, depositAmount, token, cancelable, transferable, shape)
 * - UnlockAmounts: Matches Sablier V3 (start, cliff)
 * - Durations: Matches Sablier V3 (cliff, total)
 * - createWithDurationsLL: payable, returns streamId
 * - withdrawMax: returns uint128
 * - withdrawableAmountOf: returns uint128
 * - cancel, isCancelable: match interface
 */
contract MockSablier {
    using SafeERC20 for IERC20;

    // ============ Structs (matching Sablier V3 ISablierLockup exactly) ============

    /// @notice Struct matching Sablier V3 CreateWithDurations
    struct CreateWithDurations {
        address sender;           // Stream creator (can cancel if cancelable)
        address recipient;        // Stream recipient
        uint128 depositAmount;    // Total amount to stream
        IERC20 token;            // ERC20 token to stream
        bool cancelable;         // Whether stream can be canceled
        bool transferable;       // Whether stream NFT is transferable
        string shape;            // UI differentiation (e.g., "Linear")
    }

    /// @notice Struct matching Sablier V3 UnlockAmounts
    struct UnlockAmounts {
        uint128 start;   // Amount unlocked at stream start
        uint128 cliff;   // Amount unlocked at cliff
    }

    /// @notice Struct matching Sablier V3 Durations
    struct Durations {
        uint40 cliff;    // Cliff duration in seconds
        uint40 total;    // Total stream duration in seconds
    }

    /// @notice Internal stream state (extended for proper Sablier behavior)
    struct Stream {
        address sender;
        address recipient;
        uint128 depositAmount;
        uint128 withdrawnAmount;
        IERC20 token;
        uint40 startTime;
        uint40 cliffTime;        // Time when cliff unlocks
        uint40 endTime;
        uint128 startUnlock;     // Amount unlocked at start
        uint128 cliffUnlock;     // Amount unlocked at cliff
        bool cancelable;
        bool transferable;
        bool canceled;
    }

    // ============ Storage ============

    uint256 public nextStreamId = 1;
    mapping(uint256 => Stream) public streams;

    // ============ Events ============

    event StreamCreated(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint128 depositAmount,
        IERC20 token,
        uint40 startTime,
        uint40 endTime
    );

    event Withdraw(
        uint256 indexed streamId,
        address indexed to,
        uint128 amount
    );

    // ============ Core Functions ============

    /**
     * @notice Create a stream with durations (Linear Lockup)
     * @dev Matches Sablier V3 ISablierLockup.createWithDurationsLL signature exactly
     * @param params Stream creation parameters
     * @param unlockAmounts Amounts unlocked at start/cliff (handled for compatibility)
     * @param durations Cliff and total duration
     * @return streamId The ID of the created stream
     */
    function createWithDurationsLL(
        CreateWithDurations calldata params,
        UnlockAmounts calldata unlockAmounts,
        Durations calldata durations
    ) external payable returns (uint256 streamId) {
        require(params.depositAmount > 0, "MockSablier: zero deposit");
        require(params.recipient != address(0), "MockSablier: zero recipient");
        require(durations.total > 0, "MockSablier: zero duration");
        require(durations.cliff <= durations.total, "MockSablier: cliff > total");

        // Transfer tokens from sender to this contract
        params.token.safeTransferFrom(msg.sender, address(this), params.depositAmount);

        streamId = nextStreamId++;

        uint40 startTime = uint40(block.timestamp);
        uint40 cliffTime = startTime + durations.cliff;
        uint40 endTime = startTime + durations.total;

        streams[streamId] = Stream({
            sender: params.sender,
            recipient: params.recipient,
            depositAmount: params.depositAmount,
            withdrawnAmount: 0,
            token: params.token,
            startTime: startTime,
            cliffTime: cliffTime,
            endTime: endTime,
            startUnlock: unlockAmounts.start,
            cliffUnlock: unlockAmounts.cliff,
            cancelable: params.cancelable,
            transferable: params.transferable,
            canceled: false
        });

        emit StreamCreated(
            streamId,
            params.sender,
            params.recipient,
            params.depositAmount,
            params.token,
            startTime,
            endTime
        );
    }

    /**
     * @notice Get withdrawable amount for a stream
     * @dev Matches Sablier V3 LockupMath.calculateStreamedAmountLL exactly:
     *      - Returns 0 if stream hasn't started
     *      - Returns startUnlock if after start but before cliff
     *      - Returns full deposit if stream ended
     *      - Otherwise: startUnlock + cliffUnlock + (elapsed * streamableAmount / range)
     */
    function withdrawableAmountOf(uint256 streamId) public view returns (uint128) {
        Stream storage stream = streams[streamId];
        if (stream.canceled || stream.depositAmount == 0) {
            return 0;
        }

        uint40 currentTime = uint40(block.timestamp);

        // Stream hasn't started yet
        if (currentTime <= stream.startTime) {
            return 0;
        }

        uint128 streamedAmount;

        // Stream has ended - return full deposit
        if (currentTime >= stream.endTime) {
            streamedAmount = stream.depositAmount;
        }
        // Before cliff time - only startUnlock is available
        else if (currentTime < stream.cliffTime) {
            streamedAmount = stream.startUnlock;
        }
        // After cliff - calculate linear vesting
        else {
            // Streamable amount is deposit minus unlock amounts
            uint128 streamableAmount = stream.depositAmount - stream.startUnlock - stream.cliffUnlock;

            // Calculate elapsed time and range from cliff (or start if no cliff)
            uint256 elapsed;
            uint256 range;

            if (stream.cliffTime > stream.startTime) {
                // Has cliff: measure from cliff time
                elapsed = currentTime - stream.cliffTime;
                range = stream.endTime - stream.cliffTime;
            } else {
                // No cliff: measure from start time
                elapsed = currentTime - stream.startTime;
                range = stream.endTime - stream.startTime;
            }

            // Linear vesting: unlocks + (elapsed * streamable / range)
            uint128 vestedAmount = uint128((uint256(streamableAmount) * elapsed) / range);
            streamedAmount = stream.startUnlock + stream.cliffUnlock + vestedAmount;

            // Safety check: never exceed deposit
            if (streamedAmount > stream.depositAmount) {
                streamedAmount = stream.depositAmount;
            }
        }

        return streamedAmount - stream.withdrawnAmount;
    }

    /**
     * @notice Withdraw from a stream
     */
    function withdraw(uint256 streamId, address to, uint128 amount) external returns (uint128) {
        Stream storage stream = streams[streamId];
        require(msg.sender == stream.recipient || msg.sender == stream.sender, "MockSablier: not authorized");
        require(!stream.canceled, "MockSablier: stream canceled");

        uint128 withdrawable = withdrawableAmountOf(streamId);
        require(amount <= withdrawable, "MockSablier: amount exceeds withdrawable");

        stream.withdrawnAmount += amount;
        stream.token.safeTransfer(to, amount);

        emit Withdraw(streamId, to, amount);
        return amount;
    }

    /**
     * @notice Withdraw maximum available amount
     */
    function withdrawMax(uint256 streamId, address to) external returns (uint128) {
        uint128 withdrawable = withdrawableAmountOf(streamId);
        if (withdrawable > 0) {
            Stream storage stream = streams[streamId];
            stream.withdrawnAmount += withdrawable;
            stream.token.safeTransfer(to, withdrawable);
            emit Withdraw(streamId, to, withdrawable);
        }
        return withdrawable;
    }

    /**
     * @notice Cancel a stream (if cancelable)
     */
    function cancel(uint256 streamId) external {
        Stream storage stream = streams[streamId];
        require(msg.sender == stream.sender, "MockSablier: not sender");
        require(stream.cancelable, "MockSablier: not cancelable");
        require(!stream.canceled, "MockSablier: already canceled");

        stream.canceled = true;

        // Return remaining funds to sender
        uint128 withdrawable = withdrawableAmountOf(streamId);
        uint128 remaining = stream.depositAmount - stream.withdrawnAmount - withdrawable;

        if (withdrawable > 0) {
            stream.withdrawnAmount += withdrawable;
            stream.token.safeTransfer(stream.recipient, withdrawable);
        }

        if (remaining > 0) {
            stream.token.safeTransfer(stream.sender, remaining);
        }
    }

    // ============ View Functions (Matching Sablier V3 ISablierLockup) ============

    /**
     * @notice Get the streamed amount for a stream (before subtracting withdrawn)
     * @dev Matches Sablier V3 streamedAmountOf
     */
    function streamedAmountOf(uint256 streamId) public view returns (uint128) {
        Stream storage stream = streams[streamId];

        // For canceled streams, streamed = withdrawn (all vested was sent to recipient at cancel time)
        if (stream.canceled) {
            return stream.withdrawnAmount;
        }
        if (stream.depositAmount == 0) {
            return 0;
        }

        uint40 currentTime = uint40(block.timestamp);
        if (currentTime <= stream.startTime) {
            return 0;
        }
        if (currentTime >= stream.endTime) {
            return stream.depositAmount;
        }
        if (currentTime < stream.cliffTime) {
            return stream.startUnlock;
        }

        uint128 streamableAmount = stream.depositAmount - stream.startUnlock - stream.cliffUnlock;
        uint256 elapsed;
        uint256 range;

        if (stream.cliffTime > stream.startTime) {
            elapsed = currentTime - stream.cliffTime;
            range = stream.endTime - stream.cliffTime;
        } else {
            elapsed = currentTime - stream.startTime;
            range = stream.endTime - stream.startTime;
        }

        uint128 vestedAmount = uint128((uint256(streamableAmount) * elapsed) / range);
        uint128 streamedAmount = stream.startUnlock + stream.cliffUnlock + vestedAmount;

        return streamedAmount > stream.depositAmount ? stream.depositAmount : streamedAmount;
    }

    /**
     * @notice Get the refundable amount for the sender
     * @dev Matches Sablier V3 refundableAmountOf
     */
    function refundableAmountOf(uint256 streamId) external view returns (uint128) {
        return _refundableAmountOf(streamId);
    }

    function _refundableAmountOf(uint256 streamId) internal view returns (uint128) {
        Stream storage stream = streams[streamId];
        if (stream.canceled || stream.depositAmount == 0) {
            return 0;
        }
        return stream.depositAmount - streamedAmountOf(streamId);
    }

    /**
     * @notice Get the status of a stream
     * @dev Matches Sablier V3 Status enum: PENDING, STREAMING, SETTLED, CANCELED, DEPLETED
     */
    function statusOf(uint256 streamId) external view returns (uint8) {
        Stream storage stream = streams[streamId];

        if (stream.depositAmount == 0) {
            return 0; // PENDING (or non-existent)
        }
        if (stream.canceled) {
            return 3; // CANCELED
        }
        if (stream.withdrawnAmount >= stream.depositAmount) {
            return 4; // DEPLETED
        }
        if (block.timestamp >= stream.endTime) {
            return 2; // SETTLED
        }
        if (block.timestamp > stream.startTime) {
            return 1; // STREAMING
        }
        return 0; // PENDING
    }

    function getStream(uint256 streamId) external view returns (Stream memory) {
        return streams[streamId];
    }

    function getRecipient(uint256 streamId) external view returns (address) {
        return streams[streamId].recipient;
    }

    function getSender(uint256 streamId) external view returns (address) {
        return streams[streamId].sender;
    }

    function getDepositedAmount(uint256 streamId) external view returns (uint128) {
        return streams[streamId].depositAmount;
    }

    function getWithdrawnAmount(uint256 streamId) external view returns (uint128) {
        return streams[streamId].withdrawnAmount;
    }

    function isCancelable(uint256 streamId) external view returns (bool) {
        return streams[streamId].cancelable;
    }

    function wasCanceled(uint256 streamId) external view returns (bool) {
        return streams[streamId].canceled;
    }
}
