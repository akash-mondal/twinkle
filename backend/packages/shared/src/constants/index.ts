export * from './addresses.js';
export * from './eip712.js';

/**
 * Protocol fee configuration
 */
export const PROTOCOL_FEES = {
  /** Default fee in basis points (2.5% = 250 bps) */
  DEFAULT_FEE_BPS: 250,
  /** Basis points denominator */
  BPS_DENOMINATOR: 10000,
} as const;

/**
 * MNEE Token decimals
 */
export const MNEE_DECIMALS = 18;

/**
 * Format MNEE amount from wei to human readable
 */
export function formatMNEE(amount: bigint): string {
  const divisor = BigInt(10 ** MNEE_DECIMALS);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(MNEE_DECIMALS, '0').slice(0, 2);
  return `${whole}.${fractionStr}`;
}

/**
 * Parse MNEE amount from human readable to wei
 */
export function parseMNEE(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const fractionPadded = fraction.padEnd(MNEE_DECIMALS, '0').slice(0, MNEE_DECIMALS);
  return BigInt(whole) * BigInt(10 ** MNEE_DECIMALS) + BigInt(fractionPadded);
}
