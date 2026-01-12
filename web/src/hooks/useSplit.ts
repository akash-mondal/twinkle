'use client';

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toHex, parseUnits, encodePacked } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import TwinkleSplitABI from '@/abis/TwinkleSplit.json';
import ERC20ABI from '@/abis/ERC20.json';

// Percentage scale: 10000 = 100%
export const PERCENTAGE_SCALE = 10000;

// Generate short ID (6 chars) and full bytes32
export function generateSplitId(): { shortId: string; fullId: `0x${string}` } {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const shortId = (timestamp + random).slice(-6).toUpperCase();
  const fullId = keccak256(toHex(shortId)) as `0x${string}`;
  return { shortId, fullId };
}

// Parse MNEE amount to wei (18 decimals)
export function parseMNEEAmount(amount: string): bigint {
  return parseUnits(amount, 18);
}

// Create split hook
export function useCreateSplit() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createSplit = async (
    fullId: `0x${string}`,
    recipients: `0x${string}`[],
    percentages: number[], // percentages as integers (e.g., 5000 = 50%)
    isMutable: boolean = false
  ) => {
    await writeContract({
      address: CONTRACTS.TwinkleSplit as `0x${string}`,
      abi: TwinkleSplitABI,
      functionName: 'createSplit',
      args: [fullId, recipients, percentages.map(p => BigInt(p)), isMutable],
    });
  };

  return { createSplit, isPending, isConfirming, isSuccess, hash, error, reset };
}

// Get split details
export function useSplit(splitId: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.TwinkleSplit as `0x${string}`,
    abi: TwinkleSplitABI,
    functionName: 'getSplit',
    args: splitId ? [splitId] : undefined,
    query: {
      enabled: !!splitId,
    },
  });
}

// Check if split is active
export function useIsSplitActive(splitId: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.TwinkleSplit as `0x${string}`,
    abi: TwinkleSplitABI,
    functionName: 'isSplitActive',
    args: splitId ? [splitId] : undefined,
    query: {
      enabled: !!splitId,
    },
  });
}

// Get pending withdrawal for user
export function usePendingWithdrawal(
  splitId: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: CONTRACTS.TwinkleSplit as `0x${string}`,
    abi: TwinkleSplitABI,
    functionName: 'getPendingWithdrawal',
    args: splitId && userAddress ? [splitId, userAddress] : undefined,
    query: {
      enabled: !!splitId && !!userAddress,
    },
  });
}

// MNEE approval hook for splits
export function useMNEEApprovalForSplit() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = async (amount: bigint) => {
    await writeContract({
      address: CONTRACTS.MNEE as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [CONTRACTS.TwinkleSplit, amount],
    });
  };

  return { approve, isPending, isConfirming, isSuccess, hash, error, reset };
}

// Check MNEE allowance for splits
export function useMNEEAllowanceForSplit(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.MNEE as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, CONTRACTS.TwinkleSplit] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Get MNEE balance
export function useMNEEBalance(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.MNEE as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Receive funds (deposit into split)
export function useReceiveFunds() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const receiveFunds = async (splitId: `0x${string}`, amount: bigint) => {
    await writeContract({
      address: CONTRACTS.TwinkleSplit as `0x${string}`,
      abi: TwinkleSplitABI,
      functionName: 'receiveFunds',
      args: [splitId, amount],
    });
  };

  return { receiveFunds, isPending, isConfirming, isSuccess, hash, error, reset };
}

// Distribute funds to recipients
export function useDistribute() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const distribute = async (
    splitId: `0x${string}`,
    recipients: `0x${string}`[],
    percentages: number[]
  ) => {
    await writeContract({
      address: CONTRACTS.TwinkleSplit as `0x${string}`,
      abi: TwinkleSplitABI,
      functionName: 'distribute',
      args: [splitId, recipients, percentages.map(p => BigInt(p))],
    });
  };

  return { distribute, isPending, isConfirming, isSuccess, hash, error, reset };
}

// Withdraw pending balance
export function useWithdraw() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = async (splitId: `0x${string}`) => {
    await writeContract({
      address: CONTRACTS.TwinkleSplit as `0x${string}`,
      abi: TwinkleSplitABI,
      functionName: 'withdraw',
      args: [splitId],
    });
  };

  return { withdraw, isPending, isConfirming, isSuccess, hash, error, reset };
}

// Helper: Parse split data from contract response
export interface SplitData {
  creator: string;
  totalDistributed: bigint;
  isMutable: boolean;
  active: boolean;
  recipientsHash: string;
  balance: bigint;
  pendingTotal: bigint;
}

export function parseSplitData(data: any): SplitData | null {
  if (!data) return null;
  return {
    creator: data[0] as string,
    totalDistributed: data[1] as bigint,
    isMutable: data[2] as boolean,
    active: data[3] as boolean,
    recipientsHash: data[4] as string,
    balance: data[5] as bigint,
    pendingTotal: data[6] as bigint,
  };
}

// Compute recipients hash (for verification)
export function computeRecipientsHash(
  recipients: `0x${string}`[],
  percentages: number[]
): `0x${string}` {
  // Pack addresses and percentages together
  const types: ('address' | 'uint256')[] = [];
  const values: any[] = [];
  for (let i = 0; i < recipients.length; i++) {
    types.push('address', 'uint256');
    values.push(recipients[i], BigInt(percentages[i]));
  }
  const encoded = encodePacked(types, values);
  return keccak256(encoded);
}

// Format percentage for display
export function formatPercentage(value: number): string {
  return `${(value / 100).toFixed(2)}%`;
}
