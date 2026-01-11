// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/ITwinkleCore.sol";
import "./base/TwinkleDefensive.sol";

/**
 * @title IMNEEEscrow
 * @notice Minimal interface for MNEE-specific functions
 */
interface IMNEEEscrow {
    function paused() external view returns (bool);
    function blacklisted(address account) external view returns (bool);
    function frozen(address account) external view returns (bool);
}

// Sablier V3 Lockup interface (unified for all stream types)
interface ISablierLockup {
    // Base struct for createWithDurations (matches Sablier V3 exactly)
    struct CreateWithDurations {
        address sender;
        address recipient;
        uint128 depositAmount;
        IERC20 token;           // Note: Sablier uses "token" not "asset"
        bool cancelable;
        bool transferable;
        string shape;           // UI differentiation (e.g., "Linear")
    }

    // Linear stream unlock amounts
    struct UnlockAmounts {
        uint128 start;   // Amount unlocked at start
        uint128 cliff;   // Amount unlocked at cliff
    }

    // Duration parameters for linear streams
    struct Durations {
        uint40 cliff;
        uint40 total;
    }

    function createWithDurationsLL(
        CreateWithDurations calldata params,
        UnlockAmounts calldata unlockAmounts,
        Durations calldata durations
    ) external payable returns (uint256 streamId);

    function withdrawMax(uint256 streamId, address to) external returns (uint128 withdrawnAmount);
    function withdrawableAmountOf(uint256 streamId) external view returns (uint128);
    function cancel(uint256 streamId) external;
    function isCancelable(uint256 streamId) external view returns (bool);
}

/**
 * @title TwinkleEscrow
 * @notice Milestone-based escrow with optional Sablier streaming release
 * @dev V5 - Supports instant release, streaming release, disputes, and defensive patterns
 *
 * Key features:
 * - Milestone-based project management
 * - Instant or streaming payment release via Sablier
 * - Arbitrator-based dispute resolution
 * - Auto-approval timeout for milestones
 * - Defensive patterns: flash loan protection, rate limiting, backup recipients
 * - MNEE upgrade detection
 * - Stream cancellation on project cancel
 */
contract TwinkleEscrow is ReentrancyGuard, TwinkleDefensive {
    using SafeERC20 for IERC20;

    // ============ Enums (packed into uint8) ============
    enum ProjectStatus { Draft, AwaitingFunding, Active, Completed, Cancelled, Disputed }
    enum MilestoneStatus { Pending, Requested, Approved, Streaming, Complete, Disputed }
    enum DisputeResolution { None, Arbitrator }

    // ============ Optimized Structs ============

    // Milestone: 1 slot + 1 slot for streamId
    struct Milestone {
        uint128 amount;              // slot 0: 16 bytes
        uint32 streamDurationDays;   // slot 0: 4 bytes
        MilestoneStatus status;      // slot 0: 1 byte
        uint40 requestedAt;          // slot 0: 5 bytes
        uint40 approvedAt;           // slot 0: 5 bytes
        // 1 byte free
        uint256 streamId;            // slot 1: 32 bytes (Sablier stream ID)
    }

    // Project: 4 slots
    struct Project {
        address freelancer;             // slot 0: 20 bytes
        ProjectStatus status;           // slot 0: 1 byte
        DisputeResolution disputeRes;   // slot 0: 1 byte
        uint8 milestoneCount;           // slot 0: 1 byte
        uint16 arbitratorFeeBps;        // slot 0: 2 bytes
        uint16 approvalTimeoutDays;     // slot 0: 2 bytes
        // 5 bytes free in slot 0

        address client;                 // slot 1: 20 bytes
        uint96 totalAmount;             // slot 1: 12 bytes

        address arbitrator;             // slot 2: 20 bytes
        uint96 fundedAmount;            // slot 2: 12 bytes

        address splitAddress;           // slot 3: 20 bytes
        uint96 releasedAmount;          // slot 3: 12 bytes
    }

    // Dispute
    struct Dispute {
        uint8 milestoneIndex;
        address disputedBy;
        uint40 createdAt;
        bool resolved;
        string reason;
    }

    // ============ Immutables ============
    ITwinkleCore public immutable core;
    IERC20 public immutable mnee;
    ISablierLockup public immutable sablier;

    // ============ Storage ============
    mapping(bytes32 => Project) public projects;
    mapping(bytes32 => Milestone[]) internal _milestones;
    mapping(bytes32 => Dispute) public disputes;

    /// @notice Last funding block per project (flash loan protection)
    mapping(bytes32 => uint256) public lastFundingBlock;

    /// @notice Milestone request count per user for rate limiting
    mapping(address => uint256) public milestoneRequestCount;

    // ============ Events ============
    event ProjectCreated(
        bytes32 indexed id,
        address indexed freelancer,
        address indexed client,
        uint256 totalAmount,
        uint8 milestoneCount
    );

    event ProjectFunded(
        bytes32 indexed id,
        address indexed funder,
        uint256 amount
    );

    event MilestoneRequested(
        bytes32 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed freelancer
    );

    event MilestoneApproved(
        bytes32 indexed projectId,
        uint256 indexed milestoneIndex,
        uint256 streamId,
        uint256 amount,
        bool isStreaming
    );

    event StreamWithdrawn(
        bytes32 indexed projectId,
        uint256 indexed milestoneIndex,
        uint256 amount
    );

    event MilestoneCompleted(
        bytes32 indexed projectId,
        uint256 indexed milestoneIndex
    );

    event DisputeOpened(
        bytes32 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed disputedBy,
        string reason
    );

    event DisputeResolved(
        bytes32 indexed projectId,
        bool freelancerWins,
        uint256 amount,
        uint256 arbitratorFee
    );

    event ProjectCancelled(
        bytes32 indexed projectId,
        uint256 refundAmount,
        address indexed cancelledBy
    );

    event ProjectCompleted(bytes32 indexed projectId);

    event StreamCancelled(
        bytes32 indexed projectId,
        uint256 indexed milestoneIndex,
        uint256 streamId
    );

    // ============ Errors ============
    error ProjectNotFound();
    error NotFreelancer();
    error NotClient();
    error NotParticipant();
    error InvalidStatus();
    error AlreadyFunded();
    error MilestoneNotReady();
    error ApprovalNotTimedOut();
    error DisputeActive();
    error NotArbitrator();
    error IdExists();
    error InvalidMilestones();
    error InvalidClient();
    error InvalidArbitrator();
    error FeeTooHigh();
    error MilestonesInProgress();
    error ContractPaused();
    error InvalidMilestoneIndex();
    error ZeroAddress();
    error FundingTooSoon();
    error StreamCreationFailed();
    error MNEEPaused();

    // ============ Constructor ============
    constructor(address _core) {
        if (_core == address(0)) revert ZeroAddress();
        core = ITwinkleCore(_core);
        mnee = IERC20(core.mnee());
        sablier = ISablierLockup(core.sablierLockup());
    }

    // ============ Modifiers ============
    modifier whenNotPaused() {
        if (Pausable(address(core)).paused()) revert ContractPaused();
        _;
    }

    modifier whenMNEENotPaused() {
        if (IMNEEEscrow(address(mnee)).paused()) revert MNEEPaused();
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == core.owner(), "Not owner");
        _;
    }

    // ============ Admin Functions ============

    /**
     * @notice Enable MNEE upgrade detection
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

    // ============ Project Creation ============

    /**
     * @notice Create a new escrow project
     * @param id Unique project identifier
     * @param client Client address who will fund the project
     * @param splitAddress Optional split contract for revenue distribution
     * @param disputeResolution Dispute resolution method
     * @param arbitrator Arbitrator address (if using arbitrator resolution)
     * @param arbitratorFeeBps Arbitrator fee in basis points
     * @param approvalTimeoutDays Days before auto-approval
     * @param milestoneAmounts Array of milestone amounts
     * @param streamDurations Array of stream durations (0 for instant release)
     */
    function createProject(
        bytes32 id,
        address client,
        address splitAddress,
        DisputeResolution disputeResolution,
        address arbitrator,
        uint16 arbitratorFeeBps,
        uint16 approvalTimeoutDays,
        uint128[] calldata milestoneAmounts,
        uint32[] calldata streamDurations
    ) external whenNotPaused returns (bytes32) {
        // Validations
        if (projects[id].freelancer != address(0)) revert IdExists();
        if (client == address(0) || client == msg.sender) revert InvalidClient();

        uint256 len = milestoneAmounts.length;
        if (len != streamDurations.length) revert InvalidMilestones();
        if (len == 0 || len > 20) revert InvalidMilestones();

        if (disputeResolution == DisputeResolution.Arbitrator) {
            if (arbitrator == address(0)) revert InvalidArbitrator();
            if (arbitratorFeeBps > 2000) revert FeeTooHigh(); // Max 20%
        }

        // Calculate total
        uint128 total;
        for (uint256 i; i < len; ) {
            if (milestoneAmounts[i] == 0) revert InvalidMilestones();
            total += milestoneAmounts[i];

            _milestones[id].push(Milestone({
                amount: milestoneAmounts[i],
                streamDurationDays: streamDurations[i],
                status: MilestoneStatus.Pending,
                requestedAt: 0,
                approvedAt: 0,
                streamId: 0
            }));

            unchecked { ++i; }
        }

        projects[id] = Project({
            freelancer: msg.sender,
            status: ProjectStatus.AwaitingFunding,
            disputeRes: disputeResolution,
            milestoneCount: uint8(len),
            arbitratorFeeBps: arbitratorFeeBps,
            approvalTimeoutDays: approvalTimeoutDays > 0 ? approvalTimeoutDays : 14,
            client: client,
            totalAmount: uint96(total),
            arbitrator: arbitrator,
            fundedAmount: 0,
            splitAddress: splitAddress,
            releasedAmount: 0
        });

        emit ProjectCreated(id, msg.sender, client, total, uint8(len));
        return id;
    }

    // ============ Funding ============

    /**
     * @notice Fund a project (client only)
     * @param projectId Project ID
     */
    function fundProject(bytes32 projectId)
        external
        nonReentrant
        whenNotPaused
        whenMNEENotPaused
        noFlashLoan
    {
        _checkMNEEIntegrity(address(mnee));

        Project storage project = projects[projectId];
        if (project.freelancer == address(0)) revert ProjectNotFound();
        if (project.status != ProjectStatus.AwaitingFunding) revert InvalidStatus();
        if (msg.sender != project.client) revert NotClient();

        // Flash loan protection per project
        if (lastFundingBlock[projectId] == block.number) revert FundingTooSoon();
        lastFundingBlock[projectId] = block.number;

        uint256 amount = project.totalAmount;

        // Effects
        project.fundedAmount = project.totalAmount;
        project.status = ProjectStatus.Active;

        // Interactions
        mnee.safeTransferFrom(msg.sender, address(this), amount);

        emit ProjectFunded(projectId, msg.sender, amount);
    }

    // ============ Milestone Management ============

    /**
     * @notice Request approval for a milestone (freelancer only)
     * @param projectId Project ID
     * @param milestoneIndex Index of the milestone
     */
    function requestMilestone(bytes32 projectId, uint256 milestoneIndex)
        external
        withinRateLimit
    {
        Project storage project = projects[projectId];
        if (project.freelancer == address(0)) revert ProjectNotFound();
        if (msg.sender != project.freelancer) revert NotFreelancer();
        if (project.status != ProjectStatus.Active) revert InvalidStatus();
        if (milestoneIndex >= project.milestoneCount) revert InvalidMilestoneIndex();

        Milestone storage milestone = _milestones[projectId][milestoneIndex];
        if (milestone.status != MilestoneStatus.Pending) revert MilestoneNotReady();

        milestone.status = MilestoneStatus.Requested;
        milestone.requestedAt = uint40(block.timestamp);

        emit MilestoneRequested(projectId, milestoneIndex, msg.sender);
    }

    /**
     * @notice Approve a milestone (client only)
     * @param projectId Project ID
     * @param milestoneIndex Index of the milestone
     */
    function approveMilestone(bytes32 projectId, uint256 milestoneIndex)
        external
        nonReentrant
        whenNotPaused
        whenMNEENotPaused
        noFlashLoan
    {
        _checkMNEEIntegrity(address(mnee));

        Project storage project = projects[projectId];
        if (msg.sender != project.client) revert NotClient();
        if (project.status != ProjectStatus.Active) revert InvalidStatus();
        if (milestoneIndex >= project.milestoneCount) revert InvalidMilestoneIndex();

        _approveMilestoneInternal(projectId, milestoneIndex);
    }

    /**
     * @notice Trigger auto-approval after timeout
     * @param projectId Project ID
     * @param milestoneIndex Index of the milestone
     */
    function triggerAutoApproval(bytes32 projectId, uint256 milestoneIndex)
        external
        nonReentrant
        whenNotPaused
        whenMNEENotPaused
    {
        _checkMNEEIntegrity(address(mnee));

        Project storage project = projects[projectId];
        Milestone storage milestone = _milestones[projectId][milestoneIndex];

        if (milestone.status != MilestoneStatus.Requested) revert MilestoneNotReady();

        uint256 timeoutSeconds = uint256(project.approvalTimeoutDays) * 1 days;
        if (block.timestamp < milestone.requestedAt + timeoutSeconds) {
            revert ApprovalNotTimedOut();
        }

        _approveMilestoneInternal(projectId, milestoneIndex);
    }

    /**
     * @dev Internal milestone approval logic
     */
    function _approveMilestoneInternal(bytes32 projectId, uint256 milestoneIndex) internal {
        Project storage project = projects[projectId];
        Milestone storage milestone = _milestones[projectId][milestoneIndex];

        if (milestone.status != MilestoneStatus.Requested) revert MilestoneNotReady();

        // Check no active dispute (only if a dispute was actually raised)
        Dispute storage dispute = disputes[projectId];
        if (dispute.disputedBy != address(0) &&
            dispute.milestoneIndex == milestoneIndex &&
            !dispute.resolved) {
            revert DisputeActive();
        }

        milestone.approvedAt = uint40(block.timestamp);

        uint256 amount = milestone.amount;
        uint256 platformFee = core.calculateFee(amount);
        uint256 netAmount = amount - platformFee;

        project.releasedAmount += uint96(amount);

        // Platform fee (with blacklist fallback)
        if (platformFee > 0) {
            _safeTransferWithFallback(mnee, core.treasury(), platformFee);
        }

        uint256 streamId;
        bool isStreaming = milestone.streamDurationDays > 0;

        if (!isStreaming) {
            // Instant release
            milestone.status = MilestoneStatus.Complete;
            _distributeToFreelancer(project, netAmount);
            emit MilestoneCompleted(projectId, milestoneIndex);
        } else {
            // Create Sablier stream
            milestone.status = MilestoneStatus.Streaming;

            mnee.approve(address(sablier), netAmount);

            address recipient = project.splitAddress != address(0)
                ? project.splitAddress
                : project.freelancer;

            streamId = sablier.createWithDurationsLL(
                ISablierLockup.CreateWithDurations({
                    sender: address(this),
                    recipient: recipient,
                    depositAmount: uint128(netAmount),
                    token: mnee,
                    cancelable: false,
                    transferable: false,
                    shape: "Linear"
                }),
                ISablierLockup.UnlockAmounts({
                    start: 0,    // No immediate unlock
                    cliff: 0     // No cliff unlock
                }),
                ISablierLockup.Durations({
                    cliff: 0,
                    total: uint40(milestone.streamDurationDays) * 1 days
                })
            );

            // Verify stream was created successfully
            if (streamId == 0) revert StreamCreationFailed();

            milestone.streamId = streamId;
        }

        _checkProjectCompletion(projectId);

        emit MilestoneApproved(projectId, milestoneIndex, streamId, netAmount, isStreaming);
    }

    // ============ Dispute Handling ============

    /**
     * @notice Open a dispute for a milestone
     * @param projectId Project ID
     * @param milestoneIndex Index of the disputed milestone
     * @param reason Description of the dispute
     */
    function openDispute(
        bytes32 projectId,
        uint256 milestoneIndex,
        string calldata reason
    ) external {
        Project storage project = projects[projectId];
        if (project.freelancer == address(0)) revert ProjectNotFound();
        if (msg.sender != project.client && msg.sender != project.freelancer) {
            revert NotParticipant();
        }
        if (project.status != ProjectStatus.Active) revert InvalidStatus();
        if (milestoneIndex >= project.milestoneCount) revert InvalidMilestoneIndex();

        Milestone storage milestone = _milestones[projectId][milestoneIndex];
        if (milestone.status != MilestoneStatus.Requested) revert MilestoneNotReady();

        milestone.status = MilestoneStatus.Disputed;
        project.status = ProjectStatus.Disputed;

        disputes[projectId] = Dispute({
            milestoneIndex: uint8(milestoneIndex),
            disputedBy: msg.sender,
            createdAt: uint40(block.timestamp),
            resolved: false,
            reason: reason
        });

        emit DisputeOpened(projectId, milestoneIndex, msg.sender, reason);
    }

    /**
     * @notice Resolve a dispute (arbitrator only)
     * @param projectId Project ID
     * @param freelancerWins Whether the freelancer wins the dispute
     */
    function resolveDispute(bytes32 projectId, bool freelancerWins)
        external
        nonReentrant
        whenMNEENotPaused
    {
        _checkMNEEIntegrity(address(mnee));

        Project storage project = projects[projectId];
        if (project.freelancer == address(0)) revert ProjectNotFound();
        if (msg.sender != project.arbitrator) revert NotArbitrator();
        if (project.status != ProjectStatus.Disputed) revert InvalidStatus();

        Dispute storage dispute = disputes[projectId];
        uint256 milestoneIndex = dispute.milestoneIndex;
        Milestone storage milestone = _milestones[projectId][milestoneIndex];

        dispute.resolved = true;
        project.status = ProjectStatus.Active;

        uint256 amount = milestone.amount;

        // Arbitrator fee
        uint256 arbitratorFee = (amount * project.arbitratorFeeBps) / 10000;
        uint256 netAmount = amount - arbitratorFee;

        if (arbitratorFee > 0) {
            _safeTransferWithFallback(mnee, project.arbitrator, arbitratorFee);
        }

        if (freelancerWins) {
            // Release to freelancer
            milestone.status = MilestoneStatus.Complete;
            project.releasedAmount += uint96(amount);
            _distributeToFreelancer(project, netAmount);
        } else {
            // Refund to client
            milestone.status = MilestoneStatus.Pending;
            _safeTransferWithFallback(mnee, project.client, netAmount);
        }

        _checkProjectCompletion(projectId);

        emit DisputeResolved(projectId, freelancerWins, amount, arbitratorFee);
    }

    // ============ Cancellation ============

    /**
     * @notice Cancel a project and refund client
     * @param projectId Project ID
     */
    function cancelProject(bytes32 projectId) external nonReentrant whenMNEENotPaused {
        Project storage project = projects[projectId];
        if (project.freelancer == address(0)) revert ProjectNotFound();
        if (msg.sender != project.client && msg.sender != project.freelancer) {
            revert NotParticipant();
        }

        // Check no milestones are in progress (except streaming which we'll cancel)
        uint256 count = project.milestoneCount;
        for (uint256 i; i < count; ) {
            MilestoneStatus s = _milestones[projectId][i].status;
            if (s == MilestoneStatus.Approved) {
                revert MilestonesInProgress();
            }
            // Cancel any active streams
            if (s == MilestoneStatus.Streaming) {
                uint256 streamId = _milestones[projectId][i].streamId;
                if (streamId > 0) {
                    try sablier.isCancelable(streamId) returns (bool cancelable) {
                        if (cancelable) {
                            try sablier.cancel(streamId) {
                                emit StreamCancelled(projectId, i, streamId);
                            } catch {}
                        }
                    } catch {}
                }
            }
            unchecked { ++i; }
        }

        uint256 refundAmount = project.fundedAmount - project.releasedAmount;
        project.status = ProjectStatus.Cancelled;

        if (refundAmount > 0) {
            _safeTransferWithFallback(mnee, project.client, refundAmount);
        }

        emit ProjectCancelled(projectId, refundAmount, msg.sender);
    }

    // ============ Internal Functions ============

    function _distributeToFreelancer(Project storage project, uint256 amount) internal {
        address recipient = project.splitAddress != address(0)
            ? project.splitAddress
            : project.freelancer;

        _safeTransferWithFallback(mnee, recipient, amount);
    }

    function _checkProjectCompletion(bytes32 projectId) internal {
        Project storage project = projects[projectId];

        uint256 count = project.milestoneCount;
        for (uint256 i; i < count; ) {
            MilestoneStatus s = _milestones[projectId][i].status;
            if (s != MilestoneStatus.Complete) {
                return;
            }
            unchecked { ++i; }
        }

        project.status = ProjectStatus.Completed;
        emit ProjectCompleted(projectId);
    }

    // ============ View Functions ============

    /**
     * @notice Get all milestones for a project
     */
    function getMilestones(bytes32 projectId) external view returns (Milestone[] memory) {
        return _milestones[projectId];
    }

    /**
     * @notice Get a specific milestone
     */
    function getMilestone(bytes32 projectId, uint256 index) external view returns (Milestone memory) {
        return _milestones[projectId][index];
    }

    /**
     * @notice Get project details
     */
    function getProject(bytes32 projectId) external view returns (
        address freelancer,
        address client,
        ProjectStatus status,
        uint256 totalAmount,
        uint256 fundedAmount,
        uint256 releasedAmount,
        uint256 milestoneCount
    ) {
        Project storage p = projects[projectId];
        return (
            p.freelancer,
            p.client,
            p.status,
            p.totalAmount,
            p.fundedAmount,
            p.releasedAmount,
            p.milestoneCount
        );
    }

    /**
     * @notice Get dispute details
     */
    function getDispute(bytes32 projectId) external view returns (
        uint8 milestoneIndex,
        address disputedBy,
        uint40 createdAt,
        bool resolved,
        string memory reason
    ) {
        Dispute storage d = disputes[projectId];
        return (
            d.milestoneIndex,
            d.disputedBy,
            d.createdAt,
            d.resolved,
            d.reason
        );
    }

    /**
     * @notice Check if project can be funded
     */
    function canFund(bytes32 projectId) external view returns (bool) {
        Project storage p = projects[projectId];
        return p.freelancer != address(0) && p.status == ProjectStatus.AwaitingFunding;
    }

    /**
     * @notice Get remaining unfunded amount
     */
    function getRemainingFunding(bytes32 projectId) external view returns (uint256) {
        Project storage p = projects[projectId];
        if (p.fundedAmount >= p.totalAmount) return 0;
        return p.totalAmount - p.fundedAmount;
    }
}
