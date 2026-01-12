'use client';

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toHex, parseUnits, formatUnits } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import TwinkleSubscriptionABI from '@/abis/TwinkleSubscription.json';
import ERC20ABI from '@/abis/ERC20.json';

// Generate short ID (6 chars) and full bytes32
export function generatePlanId(): { shortId: string; fullId: `0x${string}` } {
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

// Create subscription plan hook
export function useCreatePlan() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createPlan = async (
    fullId: `0x${string}`,
    priceInMNEE: string,
    intervalDays: number,
    trialDays: number = 0
  ) => {
    const priceWei = parseMNEEAmount(priceInMNEE);

    await writeContract({
      address: CONTRACTS.TwinkleSubscription as `0x${string}`,
      abi: TwinkleSubscriptionABI,
      functionName: 'createPlan',
      args: [
        fullId,
        priceWei,
        intervalDays,
        trialDays,
        '0x0000000000000000000000000000000000000000', // no split address
      ],
    });
  };

  return {
    createPlan,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// Get plan details
export function usePlan(planId: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.TwinkleSubscription as `0x${string}`,
    abi: TwinkleSubscriptionABI,
    functionName: 'getPlan',
    args: planId ? [planId] : undefined,
    query: {
      enabled: !!planId,
    },
  });
}

// Check if user has valid subscription
export function useHasValidSubscription(
  planId: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: CONTRACTS.TwinkleSubscription as `0x${string}`,
    abi: TwinkleSubscriptionABI,
    functionName: 'hasValidSubscription',
    args: planId && userAddress ? [planId, userAddress] : undefined,
    query: {
      enabled: !!planId && !!userAddress,
    },
  });
}

// Get user's subscription for a plan
export function useUserSubscription(
  planId: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: CONTRACTS.TwinkleSubscription as `0x${string}`,
    abi: TwinkleSubscriptionABI,
    functionName: 'getUserSubscription',
    args: planId && userAddress ? [planId, userAddress] : undefined,
    query: {
      enabled: !!planId && !!userAddress,
    },
  });
}

// Get subscription details by subId
export function useSubscription(subId: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.TwinkleSubscription as `0x${string}`,
    abi: TwinkleSubscriptionABI,
    functionName: 'getSubscription',
    args: subId ? [subId] : undefined,
    query: {
      enabled: !!subId,
    },
  });
}

// MNEE approval hook for subscriptions
export function useMNEEApprovalForSubscription() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = async (amount: bigint) => {
    await writeContract({
      address: CONTRACTS.MNEE as `0x${string}`,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [CONTRACTS.TwinkleSubscription, amount],
    });
  };

  return { approve, isPending, isConfirming, isSuccess, hash, error, reset };
}

// Check MNEE allowance for subscriptions
export function useMNEEAllowanceForSubscription(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.MNEE as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, CONTRACTS.TwinkleSubscription] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// Subscribe to a plan
export function useSubscribeToPlan() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const subscribe = async (planId: `0x${string}`) => {
    await writeContract({
      address: CONTRACTS.TwinkleSubscription as `0x${string}`,
      abi: TwinkleSubscriptionABI,
      functionName: 'subscribe',
      args: [planId],
    });
  };

  return { subscribe, isPending, isConfirming, isSuccess, hash, error, reset };
}

// Renew subscription
export function useRenewSubscription() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const renew = async (subId: `0x${string}`) => {
    await writeContract({
      address: CONTRACTS.TwinkleSubscription as `0x${string}`,
      abi: TwinkleSubscriptionABI,
      functionName: 'renew',
      args: [subId],
    });
  };

  return { renew, isPending, isConfirming, isSuccess, hash, error, reset };
}

// Cancel subscription
export function useCancelSubscription() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancel = async (subId: `0x${string}`) => {
    await writeContract({
      address: CONTRACTS.TwinkleSubscription as `0x${string}`,
      abi: TwinkleSubscriptionABI,
      functionName: 'cancel',
      args: [subId],
    });
  };

  return { cancel, isPending, isConfirming, isSuccess, hash, error, reset };
}

// Helper: Parse plan data from contract response
export interface PlanData {
  creator: string;
  price: bigint;
  intervalDays: number;
  trialDays: number;
  active: boolean;
  subscriberCount: number;
  totalRevenue: bigint;
  splitAddress: string;
}

export function parsePlanData(data: any): PlanData | null {
  if (!data) return null;
  return {
    creator: data[0] as string,
    price: data[1] as bigint,
    intervalDays: Number(data[2]),
    trialDays: Number(data[3]),
    active: data[4] as boolean,
    subscriberCount: Number(data[5]),
    totalRevenue: data[6] as bigint,
    splitAddress: data[7] as string,
  };
}

// Helper: Parse subscription data from contract response
export interface SubscriptionData {
  planId: string;
  subscriber: string;
  startedAt: number;
  currentPeriodEnd: number;
  active: boolean;
  cancelled: boolean;
}

export function parseSubscriptionData(data: any): SubscriptionData | null {
  if (!data) return null;
  return {
    planId: data[0] as string,
    subscriber: data[1] as string,
    startedAt: Number(data[2]),
    currentPeriodEnd: Number(data[3]),
    active: data[4] as boolean,
    cancelled: data[5] as boolean,
  };
}

// Helper: Format interval to human readable
export function formatInterval(days: number): string {
  if (days === 1) return 'Daily';
  if (days === 7) return 'Weekly';
  if (days === 30) return 'Monthly';
  if (days === 365) return 'Yearly';
  return `Every ${days} days`;
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
