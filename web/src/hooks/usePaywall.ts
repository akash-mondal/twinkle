'use client';

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toHex, parseUnits, formatUnits } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import TwinklePayABI from '@/abis/TwinklePay.json';
import ERC20ABI from '@/abis/ERC20.json';
import { useAccount } from 'wagmi';

// Generate short ID (6 chars) and full bytes32
export function generatePaywallId(): { shortId: string; fullId: `0x${string}` } {
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

// Create paywall hook
export function useCreatePaywall() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createPaywall = async (fullId: `0x${string}`, priceInMNEE: string) => {
    const priceWei = parseMNEEAmount(priceInMNEE);

    await writeContract({
      address: CONTRACTS.TwinklePay as `0x${string}`,
      abi: TwinklePayABI,
      functionName: 'createPaywall',
      args: [
        fullId,
        priceWei,
        '0x0000000000000000000000000000000000000000', // no split
        false, // no x402
        false, // not refundable
      ],
    });
  };

  return {
    createPaywall,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// Check if user has unlocked
export function useIsUnlocked(paywallId: `0x${string}` | undefined, userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.TwinklePay as `0x${string}`,
    abi: TwinklePayABI,
    functionName: 'isUnlocked',
    args: paywallId && userAddress ? [paywallId, userAddress] : undefined,
    query: {
      enabled: !!paywallId && !!userAddress,
    },
  });
}

// Get paywall details
export function usePaywall(paywallId: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.TwinklePay as `0x${string}`,
    abi: TwinklePayABI,
    functionName: 'getPaywall',
    args: paywallId ? [paywallId] : undefined,
    query: {
      enabled: !!paywallId,
    },
  });
}

// MNEE approval hook
export function useMNEEApproval() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = async (amount: bigint) => {
    await writeContract({
      address: CONTRACTS.MNEE as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [CONTRACTS.TwinklePay, amount],
    });
  };

  return { approve, isPending, isConfirming, isSuccess, hash, error, reset };
}

// Check MNEE allowance
export function useMNEEAllowance(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.MNEE as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, CONTRACTS.TwinklePay] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Pay for paywall hook
export function usePayPaywall() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const pay = async (paywallId: `0x${string}`) => {
    await writeContract({
      address: CONTRACTS.TwinklePay as `0x${string}`,
      abi: TwinklePayABI,
      functionName: 'pay',
      args: [paywallId],
    });
  };

  return { pay, isPending, isConfirming, isSuccess, hash, error, reset };
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

// Parse paywall data into a typed object
export function parsePaywallData(data: any): {
  creator: string;
  price: bigint;
  splitAddress: string;
  totalUnlocks: number;
  totalRevenue: bigint;
  active: boolean;
  x402Enabled: boolean;
} | null {
  if (!data) return null;
  return {
    creator: data[0] as string,
    price: data[1] as bigint,
    splitAddress: data[2] as string,
    totalUnlocks: Number(data[3]),
    totalRevenue: data[4] as bigint,
    active: data[5] as boolean,
    x402Enabled: data[6] as boolean,
  };
}

// Get paywall stats (for showing earnings)
export function usePaywallStats(shortId: string | undefined) {
  const fullId = shortId ? (keccak256(toHex(shortId)) as `0x${string}`) : undefined;
  const { data, isLoading, refetch } = usePaywall(fullId);

  const stats = parsePaywallData(data);

  return {
    stats,
    isLoading,
    refetch,
    totalRevenue: stats?.totalRevenue ?? BigInt(0),
    totalUnlocks: stats?.totalUnlocks ?? 0,
  };
}
