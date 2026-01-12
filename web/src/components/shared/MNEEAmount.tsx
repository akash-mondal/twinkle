'use client';

import { formatUnits } from 'viem';

interface MNEEAmountProps {
  amount: bigint | string | number;
  decimals?: number;
  showSymbol?: boolean;
  className?: string;
}

export function MNEEAmount({
  amount,
  decimals = 18,
  showSymbol = true,
  className = ''
}: MNEEAmountProps) {
  const formatted = typeof amount === 'bigint'
    ? formatUnits(amount, decimals)
    : typeof amount === 'number'
    ? amount.toString()
    : amount;

  // Format with up to 4 decimal places, remove trailing zeros
  const display = parseFloat(formatted).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });

  return (
    <span className={className}>
      {display}
      {showSymbol && (
        <span className="ml-1 text-[#E78B1F] font-medium">MNEE</span>
      )}
    </span>
  );
}

// Helper to parse MNEE input to bigint
export function parseMNEE(value: string, decimals = 18): bigint {
  const [whole, fraction = ''] = value.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

// Helper to format bigint to display string
export function formatMNEE(amount: bigint, decimals = 18): string {
  return formatUnits(amount, decimals);
}
