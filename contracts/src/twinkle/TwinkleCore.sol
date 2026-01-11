// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TwinkleCore
 * @notice Central configuration and registry for all Twinkle contracts
 * @dev V5 - Manages fees, treasury, operators, circuit breaker, and contract registry
 *
 * Key features:
 * - Ownable2Step for safe ownership transfer
 * - Pausable with operator support
 * - Circuit breaker for emergency withdrawals even when paused
 * - Timelock-ready admin functions
 * - Enhanced event emissions for indexability
 */
contract TwinkleCore is Ownable2Step, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Maximum platform fee (5%)
    uint256 public constant MAX_FEE_BPS = 500;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Minimum delay for timelock-protected operations (2 days)
    uint256 public constant MIN_TIMELOCK_DELAY = 2 days;

    // ============ Immutables (gas efficient - no SLOAD) ============

    /// @notice MNEE token address
    address public immutable mnee;

    /// @notice Sablier V3 Lockup contract address
    address public immutable sablierLockup;

    // ============ Configuration ============

    /// @notice Treasury address for fee collection
    address public treasury;

    /// @notice Platform fee in basis points (100 = 1%)
    uint256 public platformFeeBps;

    /// @notice Timelock controller address (for future governance)
    address public timelockController;

    // ============ Circuit Breaker ============

    /// @notice Whether circuit breaker is active (allows emergency withdrawals)
    bool public circuitBreakerActive;

    /// @notice Emergency withdrawal balances per user per token
    /// @dev token => user => amount
    mapping(address => mapping(address => uint256)) public emergencyBalances;

    /// @notice Total emergency balance per token
    mapping(address => uint256) public totalEmergencyBalance;

    // ============ Registry ============

    /// @notice Contract registry (key => address)
    mapping(bytes32 => address) public contracts;

    // ============ Access Control ============

    /// @notice Operator addresses that can pause/unpause
    mapping(address => bool) public operators;

    /// @notice Emergency operators that can activate circuit breaker
    mapping(address => bool) public emergencyOperators;

    // ============ Timelock Queue (for future governance) ============

    struct TimelockOperation {
        bytes32 operationHash;
        uint256 executeAfter;
        bool executed;
        bool cancelled;
    }

    /// @notice Pending timelock operations
    mapping(bytes32 => TimelockOperation) public timelockOperations;

    // ============ Events ============

    // Configuration events
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event ContractRegistered(bytes32 indexed key, address indexed contractAddress);

    // Operator events
    event OperatorUpdated(address indexed operator, bool status);
    event EmergencyOperatorUpdated(address indexed operator, bool status);

    // Pause events (enhanced)
    event ProtocolPaused(address indexed by, uint256 timestamp);
    event ProtocolUnpaused(address indexed by, uint256 timestamp);

    // Circuit breaker events
    event CircuitBreakerActivated(address indexed by, uint256 timestamp);
    event CircuitBreakerDeactivated(address indexed by, uint256 timestamp);
    event EmergencyBalanceDeposited(
        address indexed token,
        address indexed user,
        uint256 amount,
        address indexed depositor
    );
    event EmergencyWithdrawal(
        address indexed token,
        address indexed user,
        uint256 amount
    );

    // Timelock events
    event TimelockControllerUpdated(address indexed oldController, address indexed newController);
    event TimelockOperationQueued(
        bytes32 indexed operationId,
        bytes32 operationHash,
        uint256 executeAfter
    );
    event TimelockOperationExecuted(bytes32 indexed operationId);
    event TimelockOperationCancelled(bytes32 indexed operationId);

    // Fee events
    event FeeCollected(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        bytes32 indexed paymentType
    );

    // ============ Custom Errors ============

    error InvalidAddress();
    error FeeTooHigh();
    error NotOperator();
    error NotEmergencyOperator();
    error CircuitBreakerNotActive();
    error NoEmergencyBalance();
    error InsufficientEmergencyBalance();
    error TimelockNotReady();
    error TimelockAlreadyExecuted();
    error TimelockCancelled();
    error InvalidTimelockOperation();

    // ============ Modifiers ============

    /// @notice Restrict to owner or operators
    modifier onlyOperator() {
        if (!operators[msg.sender] && msg.sender != owner()) revert NotOperator();
        _;
    }

    /// @notice Restrict to owner or emergency operators
    modifier onlyEmergencyOperator() {
        if (!emergencyOperators[msg.sender] && msg.sender != owner()) {
            revert NotEmergencyOperator();
        }
        _;
    }

    // ============ Constructor ============

    constructor(
        address _mnee,
        address _treasury,
        address _sablierLockup
    ) Ownable() {
        // Validate inputs
        if (_mnee == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();
        if (_sablierLockup == address(0)) revert InvalidAddress();

        // Set immutables (cheaper than storage reads)
        mnee = _mnee;
        sablierLockup = _sablierLockup;

        // Set storage
        treasury = _treasury;
        platformFeeBps = 250; // 2.5% default fee
    }

    // ============ Owner Functions ============

    /**
     * @notice Update the treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidAddress();
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    /**
     * @notice Update the platform fee
     * @param _feeBps New fee in basis points (100 = 1%)
     */
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        emit PlatformFeeUpdated(platformFeeBps, _feeBps);
        platformFeeBps = _feeBps;
    }

    /**
     * @notice Register a contract in the registry
     * @param key Contract identifier (keccak256 hash of name)
     * @param contractAddress Address of the contract
     */
    function registerContract(bytes32 key, address contractAddress) external onlyOwner {
        if (contractAddress == address(0)) revert InvalidAddress();
        contracts[key] = contractAddress;
        emit ContractRegistered(key, contractAddress);
    }

    /**
     * @notice Set operator status for an address
     * @param operator Address to update
     * @param status Whether address is an operator
     */
    function setOperator(address operator, bool status) external onlyOwner {
        operators[operator] = status;
        emit OperatorUpdated(operator, status);
    }

    /**
     * @notice Set emergency operator status
     * @param operator Address to update
     * @param status Whether address is an emergency operator
     */
    function setEmergencyOperator(address operator, bool status) external onlyOwner {
        emergencyOperators[operator] = status;
        emit EmergencyOperatorUpdated(operator, status);
    }

    /**
     * @notice Set timelock controller address
     * @param _controller New timelock controller
     */
    function setTimelockController(address _controller) external onlyOwner {
        emit TimelockControllerUpdated(timelockController, _controller);
        timelockController = _controller;
    }

    // ============ Operator Functions ============

    /**
     * @notice Pause all Twinkle contracts
     * @dev Can be called by operators or owner
     */
    function pause() external onlyOperator {
        _pause();
        emit ProtocolPaused(msg.sender, block.timestamp);
    }

    /**
     * @notice Unpause all Twinkle contracts
     * @dev Can be called by operators or owner
     */
    function unpause() external onlyOperator {
        _unpause();
        emit ProtocolUnpaused(msg.sender, block.timestamp);
    }

    // ============ Circuit Breaker Functions ============

    /**
     * @notice Activate the circuit breaker
     * @dev Allows emergency withdrawals even when paused
     */
    function activateCircuitBreaker() external onlyEmergencyOperator {
        circuitBreakerActive = true;
        emit CircuitBreakerActivated(msg.sender, block.timestamp);
    }

    /**
     * @notice Deactivate the circuit breaker
     */
    function deactivateCircuitBreaker() external onlyOwner {
        circuitBreakerActive = false;
        emit CircuitBreakerDeactivated(msg.sender, block.timestamp);
    }

    /**
     * @notice Deposit funds for emergency withdrawal
     * @param token Token address (MNEE or other)
     * @param user User who can withdraw
     * @param amount Amount to deposit
     * @dev Called by Twinkle contracts when holding user funds
     */
    function depositEmergencyBalance(
        address token,
        address user,
        uint256 amount
    ) external {
        // Only registered contracts can deposit
        // In production, add access control here

        emergencyBalances[token][user] += amount;
        totalEmergencyBalance[token] += amount;

        emit EmergencyBalanceDeposited(token, user, amount, msg.sender);
    }

    /**
     * @notice Withdraw funds in emergency mode
     * @param token Token to withdraw
     * @dev Can only be called when circuit breaker is active
     */
    function emergencyWithdraw(address token) external {
        if (!circuitBreakerActive) revert CircuitBreakerNotActive();

        uint256 amount = emergencyBalances[token][msg.sender];
        if (amount == 0) revert NoEmergencyBalance();

        // Effects before interactions
        emergencyBalances[token][msg.sender] = 0;
        totalEmergencyBalance[token] -= amount;

        // Transfer
        IERC20(token).safeTransfer(msg.sender, amount);

        emit EmergencyWithdrawal(token, msg.sender, amount);
    }

    /**
     * @notice Emergency withdraw specific amount
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawAmount(address token, uint256 amount) external {
        if (!circuitBreakerActive) revert CircuitBreakerNotActive();

        uint256 balance = emergencyBalances[token][msg.sender];
        if (balance == 0) revert NoEmergencyBalance();
        if (amount > balance) revert InsufficientEmergencyBalance();

        // Effects before interactions
        emergencyBalances[token][msg.sender] = balance - amount;
        totalEmergencyBalance[token] -= amount;

        // Transfer
        IERC20(token).safeTransfer(msg.sender, amount);

        emit EmergencyWithdrawal(token, msg.sender, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Calculate platform fee for an amount
     * @param amount Amount to calculate fee for
     * @return fee The platform fee
     */
    function calculateFee(uint256 amount) external view returns (uint256) {
        return (amount * platformFeeBps) / BPS_DENOMINATOR;
    }

    /**
     * @notice Get contract address from registry
     * @param key Contract identifier
     * @return Contract address
     */
    function getContract(bytes32 key) external view returns (address) {
        return contracts[key];
    }

    /**
     * @notice Get user's emergency balance for a token
     * @param token Token address
     * @param user User address
     * @return User's emergency balance
     */
    function getEmergencyBalance(address token, address user) external view returns (uint256) {
        return emergencyBalances[token][user];
    }

    /**
     * @notice Check if an address is an operator
     * @param account Address to check
     * @return True if operator
     */
    function isOperator(address account) external view returns (bool) {
        return operators[account] || account == owner();
    }

    /**
     * @notice Check if an address is an emergency operator
     * @param account Address to check
     * @return True if emergency operator
     */
    function isEmergencyOperator(address account) external view returns (bool) {
        return emergencyOperators[account] || account == owner();
    }

    // ============ Fee Helper (for other contracts) ============

    /**
     * @notice Emit fee collected event (called by payment contracts)
     * @param from Payer address
     * @param to Recipient address
     * @param amount Total amount
     * @param fee Fee amount
     * @param paymentType Type of payment (paywall, subscription, escrow, etc.)
     */
    function emitFeeCollected(
        address from,
        address to,
        uint256 amount,
        uint256 fee,
        bytes32 paymentType
    ) external {
        // Only registered contracts can emit
        // In production, add access control
        emit FeeCollected(from, to, amount, fee, paymentType);
    }

    // ============ Timelock Functions (for future governance) ============

    /**
     * @notice Queue a timelock operation
     * @param operationId Unique operation identifier
     * @param operationHash Hash of the operation data
     * @param delay Delay before execution (minimum MIN_TIMELOCK_DELAY)
     */
    function queueTimelockOperation(
        bytes32 operationId,
        bytes32 operationHash,
        uint256 delay
    ) external onlyOwner {
        if (delay < MIN_TIMELOCK_DELAY) delay = MIN_TIMELOCK_DELAY;

        timelockOperations[operationId] = TimelockOperation({
            operationHash: operationHash,
            executeAfter: block.timestamp + delay,
            executed: false,
            cancelled: false
        });

        emit TimelockOperationQueued(operationId, operationHash, block.timestamp + delay);
    }

    /**
     * @notice Cancel a queued timelock operation
     * @param operationId Operation to cancel
     */
    function cancelTimelockOperation(bytes32 operationId) external onlyOwner {
        TimelockOperation storage op = timelockOperations[operationId];
        if (op.executeAfter == 0) revert InvalidTimelockOperation();
        if (op.executed) revert TimelockAlreadyExecuted();

        op.cancelled = true;
        emit TimelockOperationCancelled(operationId);
    }

    /**
     * @notice Check if a timelock operation is ready to execute
     * @param operationId Operation to check
     * @return ready True if ready
     * @return executeAfter Timestamp when ready
     */
    function isTimelockReady(bytes32 operationId) external view returns (
        bool ready,
        uint256 executeAfter
    ) {
        TimelockOperation storage op = timelockOperations[operationId];
        executeAfter = op.executeAfter;
        ready = !op.executed && !op.cancelled && block.timestamp >= executeAfter;
    }
}
