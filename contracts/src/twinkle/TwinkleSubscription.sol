// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/ITwinkleCore.sol";
import "./base/TwinkleDefensive.sol";

/**
 * @title TwinkleSubscription
 * @notice Recurring payment plans with auto-renewal support
 * @dev V5 - Supports trial periods, session keys, grace periods, and defensive patterns
 *
 * Key features:
 * - Subscription plans with configurable intervals
 * - Free trial periods
 * - Auto-renewal via session keys (operators can renew on behalf)
 * - Grace period handling (7 days after period end)
 * - Defensive patterns: flash loan protection, rate limiting, backup recipients
 * - MNEE upgrade detection
 */
contract TwinkleSubscription is ReentrancyGuard, TwinkleDefensive {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    uint256 public constant GRACE_PERIOD = 7 days;
    uint256 public constant RENEWAL_WINDOW = 7 days;

    // ============ Optimized Structs ============

    // Plan: 2 slots
    struct Plan {
        address creator;           // slot 0: 20 bytes
        uint96 price;              // slot 0: 12 bytes
        uint32 intervalDays;       // slot 1: 4 bytes
        uint16 trialDays;          // slot 1: 2 bytes
        bool active;               // slot 1: 1 byte
        uint32 subscriberCount;    // slot 1: 4 bytes
        address splitAddress;      // slot 1: 20 bytes (partial slot 2)
    }

    // Subscription: 2 slots
    struct Subscription {
        bytes32 planId;              // slot 0: 32 bytes
        address subscriber;          // slot 1: 20 bytes
        uint40 startedAt;            // slot 1: 5 bytes
        uint40 currentPeriodEnd;     // slot 1: 5 bytes
        bool active;                 // slot 1: 1 byte
        bool cancelled;              // slot 1: 1 byte
    }

    // Session key for auto-renewal
    struct SessionKey {
        address operator;          // Who can renew on behalf
        uint40 validUntil;         // Expiration timestamp
        uint96 maxAmount;          // Max amount per renewal (0 = unlimited)
        bool active;               // Whether key is active
    }

    // ============ Immutables ============
    ITwinkleCore public immutable core;
    IERC20 public immutable mnee;

    // ============ Storage ============
    mapping(bytes32 => Plan) public plans;
    mapping(bytes32 => uint256) public planRevenue;
    mapping(bytes32 => Subscription) public subscriptions;
    mapping(bytes32 => mapping(address => bytes32)) public userSubscriptions;

    /// @notice Session keys for auto-renewal: subscriber => session key
    mapping(address => SessionKey) public sessionKeys;

    /// @notice Approved operators for auto-renewal (global)
    mapping(address => bool) public approvedOperators;

    /// @notice Last renewal block per subscription (flash loan protection)
    mapping(bytes32 => uint256) public lastRenewalBlock;

    // ============ Events ============
    event PlanCreated(
        bytes32 indexed id,
        address indexed creator,
        uint256 price,
        uint32 intervalDays,
        uint16 trialDays
    );

    event PlanUpdated(
        bytes32 indexed id,
        uint256 newPrice,
        bool active
    );

    event Subscribed(
        bytes32 indexed planId,
        bytes32 indexed subId,
        address indexed subscriber,
        uint40 periodEnd,
        bool isTrial
    );

    event Renewed(
        bytes32 indexed subId,
        uint40 newPeriodEnd,
        uint256 amount,
        address renewedBy
    );

    event Cancelled(
        bytes32 indexed subId,
        address indexed cancelledBy
    );

    event SubscriptionEnded(
        bytes32 indexed subId,
        bool gracePeriodExpired
    );

    event SessionKeyCreated(
        address indexed subscriber,
        address indexed operator,
        uint40 validUntil,
        uint96 maxAmount
    );

    event SessionKeyRevoked(
        address indexed subscriber
    );

    event OperatorApproved(
        address indexed operator,
        bool approved
    );

    // ============ Errors ============
    error PlanNotFound();
    error PlanNotActive();
    error AlreadySubscribed();
    error NotSubscriber();
    error NotInRenewalWindow();
    error SubscriptionNotActive();
    error InvalidPrice();
    error InvalidInterval();
    error IdExists();
    error NotCreator();
    error ContractPaused();
    error SubscriptionNotFound();
    error ZeroAddress();
    error SessionKeyExpired();
    error SessionKeyNotActive();
    error NotAuthorizedOperator();
    error AmountExceedsLimit();
    error RenewalTooSoon();

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
     */
    function setWithdrawalLimits(uint256 _maxSingle, uint256 _dailyLimit) external onlyOwner {
        _setWithdrawalLimits(_maxSingle, _dailyLimit);
    }

    /**
     * @notice Approve/revoke a global operator for auto-renewals
     * @param operator Operator address
     * @param approved Whether operator is approved
     */
    function setApprovedOperator(address operator, bool approved) external onlyOwner {
        approvedOperators[operator] = approved;
        emit OperatorApproved(operator, approved);
    }

    // ============ Plan Management ============

    /**
     * @notice Create a new subscription plan
     * @param id Unique plan identifier
     * @param price Price per period in MNEE
     * @param intervalDays Billing interval in days
     * @param trialDays Free trial period in days
     * @param splitAddress Optional split contract for revenue
     * @return The plan ID
     */
    function createPlan(
        bytes32 id,
        uint96 price,
        uint32 intervalDays,
        uint16 trialDays,
        address splitAddress
    ) external whenNotPaused returns (bytes32) {
        if (plans[id].creator != address(0)) revert IdExists();
        if (price == 0) revert InvalidPrice();
        if (intervalDays == 0) revert InvalidInterval();

        plans[id] = Plan({
            creator: msg.sender,
            price: price,
            intervalDays: intervalDays,
            trialDays: trialDays,
            active: true,
            subscriberCount: 0,
            splitAddress: splitAddress
        });

        emit PlanCreated(id, msg.sender, price, intervalDays, trialDays);
        return id;
    }

    /**
     * @notice Update an existing plan
     * @param id Plan ID
     * @param newPrice New price (0 to keep current)
     * @param active Whether plan is active
     */
    function updatePlan(bytes32 id, uint96 newPrice, bool active) external {
        Plan storage plan = plans[id];
        if (plan.creator == address(0)) revert PlanNotFound();
        if (plan.creator != msg.sender) revert NotCreator();

        if (newPrice > 0) {
            plan.price = newPrice;
        }
        plan.active = active;

        emit PlanUpdated(id, newPrice > 0 ? newPrice : plan.price, active);
    }

    /**
     * @notice Update plan's split address
     * @param id Plan ID
     * @param splitAddress New split address
     */
    function updatePlanSplit(bytes32 id, address splitAddress) external {
        Plan storage plan = plans[id];
        if (plan.creator == address(0)) revert PlanNotFound();
        if (plan.creator != msg.sender) revert NotCreator();

        plan.splitAddress = splitAddress;
    }

    // ============ Session Key Management ============

    /**
     * @notice Create a session key for auto-renewal
     * @param operator Address that can renew on your behalf
     * @param validUntil Expiration timestamp for the session key
     * @param maxAmount Maximum amount per renewal (0 = plan price)
     */
    function createSessionKey(
        address operator,
        uint40 validUntil,
        uint96 maxAmount
    ) external {
        if (operator == address(0)) revert ZeroAddress();

        sessionKeys[msg.sender] = SessionKey({
            operator: operator,
            validUntil: validUntil,
            maxAmount: maxAmount,
            active: true
        });

        emit SessionKeyCreated(msg.sender, operator, validUntil, maxAmount);
    }

    /**
     * @notice Revoke your session key
     */
    function revokeSessionKey() external {
        sessionKeys[msg.sender].active = false;
        emit SessionKeyRevoked(msg.sender);
    }

    // ============ Subscription Functions ============

    /**
     * @notice Subscribe to a plan
     * @param planId Plan ID to subscribe to
     * @return subId Subscription ID
     */
    function subscribe(bytes32 planId)
        external
        nonReentrant
        whenNotPaused
        noFlashLoan
        withinRateLimit
        returns (bytes32)
    {
        _checkMNEEIntegrity(address(mnee));

        Plan storage plan = plans[planId];
        if (plan.creator == address(0)) revert PlanNotFound();
        if (!plan.active) revert PlanNotActive();

        // Check not already subscribed to this plan
        bytes32 existingSubId = userSubscriptions[planId][msg.sender];
        if (existingSubId != bytes32(0)) {
            Subscription storage existingSub = subscriptions[existingSubId];
            if (existingSub.active && !existingSub.cancelled) {
                revert AlreadySubscribed();
            }
        }

        // Generate subscription ID
        bytes32 subId = keccak256(abi.encodePacked(planId, msg.sender, block.timestamp));

        uint40 startTime = uint40(block.timestamp);
        uint40 periodEnd;
        bool isTrial = plan.trialDays > 0;

        if (isTrial) {
            // Free trial - no payment needed
            periodEnd = startTime + (uint40(plan.trialDays) * 1 days);
        } else {
            // Charge first period
            periodEnd = startTime + (uint40(plan.intervalDays) * 1 days);
            _processPayment(planId, plan, msg.sender);
        }

        subscriptions[subId] = Subscription({
            planId: planId,
            subscriber: msg.sender,
            startedAt: startTime,
            currentPeriodEnd: periodEnd,
            active: true,
            cancelled: false
        });

        userSubscriptions[planId][msg.sender] = subId;

        unchecked {
            plan.subscriberCount++;
        }

        emit Subscribed(planId, subId, msg.sender, periodEnd, isTrial);
        return subId;
    }

    /**
     * @notice Renew a subscription (self or via session key)
     * @param subId Subscription ID
     */
    function renew(bytes32 subId)
        external
        nonReentrant
        whenNotPaused
        noFlashLoan
    {
        _checkMNEEIntegrity(address(mnee));
        _renew(subId, msg.sender);
    }

    /**
     * @notice Renew a subscription on behalf of subscriber (operator)
     * @param subId Subscription ID
     */
    function renewOnBehalf(bytes32 subId)
        external
        nonReentrant
        whenNotPaused
    {
        _checkMNEEIntegrity(address(mnee));

        Subscription storage sub = subscriptions[subId];
        if (sub.subscriber == address(0)) revert SubscriptionNotFound();

        // Check if caller is authorized
        SessionKey storage key = sessionKeys[sub.subscriber];
        bool isAuthorized = false;

        if (key.active && key.operator == msg.sender && block.timestamp <= key.validUntil) {
            isAuthorized = true;
        } else if (approvedOperators[msg.sender]) {
            isAuthorized = true;
        }

        if (!isAuthorized) revert NotAuthorizedOperator();

        // Check amount limit if session key has one
        if (key.active && key.maxAmount > 0) {
            Plan storage plan = plans[sub.planId];
            if (plan.price > key.maxAmount) revert AmountExceedsLimit();
        }

        _renew(subId, sub.subscriber);
    }

    /**
     * @notice Internal renewal logic
     */
    function _renew(bytes32 subId, address payer) internal {
        Subscription storage sub = subscriptions[subId];
        if (sub.subscriber == address(0)) revert SubscriptionNotFound();
        if (!sub.active) revert SubscriptionNotActive();
        if (sub.cancelled) revert SubscriptionNotActive();

        // Flash loan protection per subscription
        if (lastRenewalBlock[subId] == block.number) revert RenewalTooSoon();
        lastRenewalBlock[subId] = block.number;

        // Check we're in renewal window (within 7 days of period end or past it)
        if (block.timestamp < sub.currentPeriodEnd - RENEWAL_WINDOW &&
            block.timestamp < sub.currentPeriodEnd) {
            revert NotInRenewalWindow();
        }

        Plan storage plan = plans[sub.planId];
        if (!plan.active) revert PlanNotActive();

        // Process payment
        _processPayment(sub.planId, plan, payer);

        // Extend subscription
        uint40 newPeriodEnd;
        if (block.timestamp >= sub.currentPeriodEnd) {
            // Lapsed - start from now
            newPeriodEnd = uint40(block.timestamp) + (uint40(plan.intervalDays) * 1 days);
        } else {
            // Active - extend from current end
            newPeriodEnd = sub.currentPeriodEnd + (uint40(plan.intervalDays) * 1 days);
        }

        sub.currentPeriodEnd = newPeriodEnd;

        emit Renewed(subId, newPeriodEnd, plan.price, msg.sender);
    }

    /**
     * @notice Cancel a subscription (no refund, runs until period end)
     * @param subId Subscription ID
     */
    function cancel(bytes32 subId) external {
        Subscription storage sub = subscriptions[subId];
        if (sub.subscriber == address(0)) revert SubscriptionNotFound();
        if (sub.subscriber != msg.sender) revert NotSubscriber();
        if (!sub.active) revert SubscriptionNotActive();

        sub.cancelled = true;

        // Decrement subscriber count
        Plan storage plan = plans[sub.planId];
        if (plan.subscriberCount > 0) {
            unchecked {
                plan.subscriberCount--;
            }
        }

        emit Cancelled(subId, msg.sender);
    }

    /**
     * @notice End an expired subscription
     * @param subId Subscription ID
     */
    function endSubscription(bytes32 subId) external {
        Subscription storage sub = subscriptions[subId];
        if (sub.subscriber == address(0)) revert SubscriptionNotFound();
        if (!sub.active) revert SubscriptionNotActive();

        bool gracePeriodExpired = false;

        // Can only end if cancelled and past period end, or if just past grace period
        if (sub.cancelled && block.timestamp >= sub.currentPeriodEnd) {
            sub.active = false;
        } else if (block.timestamp >= sub.currentPeriodEnd + GRACE_PERIOD) {
            // Grace period expired without renewal
            sub.active = false;
            gracePeriodExpired = true;

            Plan storage plan = plans[sub.planId];
            if (plan.subscriberCount > 0) {
                unchecked {
                    plan.subscriberCount--;
                }
            }
        }

        if (!sub.active) {
            emit SubscriptionEnded(subId, gracePeriodExpired);
        }
    }

    // ============ Internal Functions ============

    function _processPayment(bytes32 planId, Plan storage plan, address payer) internal {
        uint256 amount = plan.price;
        uint256 platformFee = core.calculateFee(amount);
        uint256 creatorAmount = amount - platformFee;

        mnee.safeTransferFrom(payer, address(this), amount);

        if (platformFee > 0) {
            mnee.safeTransfer(core.treasury(), platformFee);
        }

        address recipient = plan.splitAddress != address(0)
            ? plan.splitAddress
            : plan.creator;

        _safeTransferWithFallback(mnee, recipient, creatorAmount);

        unchecked {
            planRevenue[planId] += amount;
        }
    }

    // ============ View Functions ============

    /**
     * @notice Check if a subscription is currently valid
     * @param subId Subscription ID
     * @return Whether subscription is active and not expired
     */
    function isSubscriptionValid(bytes32 subId) external view returns (bool) {
        Subscription storage sub = subscriptions[subId];
        // Cancelled subscriptions remain valid until period end (user paid for this period)
        return sub.active && block.timestamp < sub.currentPeriodEnd;
    }

    /**
     * @notice Check if a subscription is in grace period
     * @param subId Subscription ID
     * @return Whether subscription is in grace period
     */
    function isInGracePeriod(bytes32 subId) external view returns (bool) {
        Subscription storage sub = subscriptions[subId];
        return sub.active &&
               !sub.cancelled &&
               block.timestamp >= sub.currentPeriodEnd &&
               block.timestamp < sub.currentPeriodEnd + GRACE_PERIOD;
    }

    /**
     * @notice Check if a user has a valid subscription to a plan
     * @param planId Plan ID
     * @param user User address
     * @return Whether user has valid subscription
     */
    function hasValidSubscription(bytes32 planId, address user) external view returns (bool) {
        bytes32 subId = userSubscriptions[planId][user];
        if (subId == bytes32(0)) return false;

        Subscription storage sub = subscriptions[subId];
        return sub.active && !sub.cancelled && block.timestamp < sub.currentPeriodEnd;
    }

    /**
     * @notice Get subscription details
     */
    function getSubscription(bytes32 subId) external view returns (
        bytes32 planId,
        address subscriber,
        uint256 startedAt,
        uint256 currentPeriodEnd,
        bool active,
        bool cancelled
    ) {
        Subscription storage sub = subscriptions[subId];
        return (
            sub.planId,
            sub.subscriber,
            sub.startedAt,
            sub.currentPeriodEnd,
            sub.active,
            sub.cancelled
        );
    }

    /**
     * @notice Get plan details
     */
    function getPlan(bytes32 planId) external view returns (
        address creator,
        uint256 price,
        uint256 intervalDays,
        uint256 trialDays,
        bool active,
        uint256 subscriberCount,
        uint256 totalRevenue,
        address splitAddress
    ) {
        Plan storage plan = plans[planId];
        return (
            plan.creator,
            plan.price,
            plan.intervalDays,
            plan.trialDays,
            plan.active,
            plan.subscriberCount,
            planRevenue[planId],
            plan.splitAddress
        );
    }

    /**
     * @notice Get user's subscription ID for a plan
     * @param planId Plan ID
     * @param user User address
     * @return Subscription ID (bytes32(0) if none)
     */
    function getUserSubscription(bytes32 planId, address user) external view returns (bytes32) {
        return userSubscriptions[planId][user];
    }

    /**
     * @notice Get session key details for a user
     */
    function getSessionKey(address user) external view returns (
        address operator,
        uint40 validUntil,
        uint96 maxAmount,
        bool active
    ) {
        SessionKey storage key = sessionKeys[user];
        return (key.operator, key.validUntil, key.maxAmount, key.active);
    }

    /**
     * @notice Check if an address can renew on behalf of subscriber
     * @param subscriber Subscriber address
     * @param operator Operator address
     * @return canRenew Whether operator can renew
     */
    function canRenewOnBehalf(address subscriber, address operator) external view returns (bool canRenew) {
        SessionKey storage key = sessionKeys[subscriber];

        if (key.active && key.operator == operator && block.timestamp <= key.validUntil) {
            return true;
        }

        return approvedOperators[operator];
    }
}
