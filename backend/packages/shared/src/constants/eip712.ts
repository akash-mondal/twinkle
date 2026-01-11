/**
 * EIP-712 Domain and Type Definitions
 * Must match TwinkleX402.sol exactly
 */

import { CONTRACTS, CHAIN_IDS } from './addresses.js';

/**
 * EIP-712 Domain for TwinkleX402
 * CRITICAL: Must match contract exactly
 */
export const X402_DOMAIN = {
  name: 'TwinkleX402',
  version: '2',
  chainId: BigInt(CHAIN_IDS.SEPOLIA),
  verifyingContract: CONTRACTS[CHAIN_IDS.SEPOLIA].TwinkleX402 as `0x${string}`,
} as const;

/**
 * EIP-712 Types for PaymentIntent
 * CRITICAL: Order and types must match contract exactly
 */
export const PAYMENT_INTENT_TYPES = {
  PaymentIntent: [
    { name: 'payer', type: 'address' },
    { name: 'requestId', type: 'bytes32' },
    { name: 'amount', type: 'uint256' },
    { name: 'validUntil', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

/**
 * EIP-712 TypeHash for PaymentIntent (pre-computed)
 * keccak256("PaymentIntent(address payer,bytes32 requestId,uint256 amount,uint256 validUntil,uint256 nonce)")
 */
export const PAYMENT_INTENT_TYPEHASH =
  '0x...'; // Will be computed from contract

/**
 * Get domain for a specific chain
 */
export function getX402Domain(chainId: number) {
  if (chainId !== CHAIN_IDS.SEPOLIA) {
    throw new Error(`X402 domain not configured for chain ${chainId}`);
  }
  return {
    name: 'TwinkleX402',
    version: '2',
    chainId: BigInt(chainId),
    verifyingContract: CONTRACTS[chainId].TwinkleX402 as `0x${string}`,
  };
}
