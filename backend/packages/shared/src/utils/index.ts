export * from './eip712.js';

import { formatUnits, parseUnits } from 'viem';

/**
 * Format address to checksummed short form
 */
export function shortAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format bigint amount with decimals
 */
export function formatAmount(amount: bigint, decimals: number = 18): string {
  return formatUnits(amount, decimals);
}

/**
 * Parse string amount to bigint
 */
export function parseAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Calculate protocol fee
 */
export function calculateFee(amount: bigint, feeBps: number = 250): bigint {
  return (amount * BigInt(feeBps)) / BigInt(10000);
}

/**
 * Calculate amount after fee
 */
export function amountAfterFee(amount: bigint, feeBps: number = 250): bigint {
  return amount - calculateFee(amount, feeBps);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Check if value is a valid Ethereum address
 */
export function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Check if value is a valid bytes32 hex string
 */
export function isBytes32(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}
