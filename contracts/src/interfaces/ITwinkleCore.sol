// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITwinkleCore
 * @notice Interface for TwinkleCore contract
 */
interface ITwinkleCore {
    // ============ View Functions ============
    function mnee() external view returns (address);
    function sablierLockup() external view returns (address);
    function treasury() external view returns (address);
    function platformFeeBps() external view returns (uint256);
    function operators(address) external view returns (bool);
    function contracts(bytes32) external view returns (address);

    // ============ Ownership ============
    function owner() external view returns (address);

    // ============ Pausable ============
    function paused() external view returns (bool);

    // ============ Circuit Breaker ============
    function circuitBreakerActive() external view returns (bool);

    // ============ Fee Calculation ============
    function calculateFee(uint256 amount) external view returns (uint256);

    // ============ Registry ============
    function getContract(bytes32 key) external view returns (address);

    // ============ Fee Event Emission ============
    function emitFeeCollected(
        address from,
        address to,
        uint256 amount,
        uint256 fee,
        bytes32 paymentType
    ) external;
}
