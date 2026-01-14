/**
 * Contract interaction helpers for Twinkle
 * Provides typed contract calls using viem
 */

import {
  type PublicClient,
  type WalletClient,
  keccak256,
  encodePacked,
  parseEther,
  formatEther,
} from 'viem';
import { CONFIG } from './config.js';

// ===== ABI Fragments =====

export const TWINKLE_PAY_ABI = [
  {
    type: 'function',
    name: 'createPaywall',
    inputs: [
      { name: 'id', type: 'bytes32' },
      { name: 'price', type: 'uint96' },
      { name: 'splitAddress', type: 'address' },
      { name: 'x402Enabled', type: 'bool' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'pay',
    inputs: [{ name: 'paywallId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPaywall',
    inputs: [{ name: 'paywallId', type: 'bytes32' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'splitAddress', type: 'address' },
      { name: 'totalUnlocks', type: 'uint256' },
      { name: 'totalRevenue', type: 'uint256' },
      { name: 'active', type: 'bool' },
      { name: 'x402Enabled', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isUnlocked',
    inputs: [
      { name: 'paywallId', type: 'bytes32' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

export const TWINKLE_X402_ABI = [
  {
    type: 'function',
    name: 'createPaymentRequest',
    inputs: [
      { name: 'payTo', type: 'address' },
      { name: 'amount', type: 'uint128' },
      { name: 'paywallId', type: 'bytes32' },
      { name: 'validFor', type: 'uint256' },
    ],
    outputs: [{ name: 'requestId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPaymentRequest',
    inputs: [{ name: 'requestId', type: 'bytes32' }],
    outputs: [
      { name: 'payTo', type: 'address' },
      { name: 'amount', type: 'uint128' },
      { name: 'paywallId', type: 'bytes32' },
      { name: 'validUntil', type: 'uint40' },
      { name: 'settled', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'settle',
    inputs: [
      { name: 'requestId', type: 'bytes32' },
      {
        name: 'intent',
        type: 'tuple',
        components: [
          { name: 'payer', type: 'address' },
          { name: 'requestId', type: 'bytes32' },
          { name: 'amount', type: 'uint256' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
        ],
      },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: 'accessProofId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'verifyAccessProof',
    inputs: [{ name: 'accessProofId', type: 'bytes32' }],
    outputs: [
      { name: 'isValid', type: 'bool' },
      {
        name: 'proof',
        type: 'tuple',
        components: [
          { name: 'requestId', type: 'bytes32' },
          { name: 'payer', type: 'address' },
          { name: 'recipient', type: 'address' },
          { name: 'amount', type: 'uint128' },
          { name: 'paywallId', type: 'bytes32' },
          { name: 'timestamp', type: 'uint40' },
          { name: 'blockNumber', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'DOMAIN_SEPARATOR',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
] as const;

export const TWINKLE_SUBSCRIPTION_ABI = [
  {
    type: 'function',
    name: 'createPlan',
    inputs: [
      { name: 'id', type: 'bytes32' },
      { name: 'price', type: 'uint96' },
      { name: 'intervalDays', type: 'uint32' },
      { name: 'trialDays', type: 'uint16' },
      { name: 'splitAddress', type: 'address' },
    ],
    outputs: [{ name: 'planId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'subscribe',
    inputs: [{ name: 'planId', type: 'bytes32' }],
    outputs: [{ name: 'subId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPlan',
    inputs: [{ name: 'planId', type: 'bytes32' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'intervalDays', type: 'uint256' },
      { name: 'trialDays', type: 'uint256' },
      { name: 'active', type: 'bool' },
      { name: 'subscriberCount', type: 'uint256' },
      { name: 'totalRevenue', type: 'uint256' },
      { name: 'splitAddress', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isSubscriptionValid',
    inputs: [{ name: 'subId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'userSubscriptions',
    inputs: [
      { name: 'planId', type: 'bytes32' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
] as const;

export const TWINKLE_SPLIT_ABI = [
  {
    type: 'function',
    name: 'createSplit',
    inputs: [
      { name: 'id', type: 'bytes32' },
      { name: 'recipients', type: 'address[]' },
      { name: 'percentages', type: 'uint256[]' },
      { name: 'mutable_', type: 'bool' },
    ],
    outputs: [{ name: 'splitId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'receiveFunds',
    inputs: [
      { name: 'splitId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'distribute',
    inputs: [
      { name: 'splitId', type: 'bytes32' },
      { name: 'recipients', type: 'address[]' },
      { name: 'percentages', type: 'uint256[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getSplit',
    inputs: [{ name: 'splitId', type: 'bytes32' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'totalDistributed', type: 'uint256' },
      { name: 'mutable_', type: 'bool' },
      { name: 'active', type: 'bool' },
      { name: 'recipientsHash', type: 'bytes32' },
      { name: 'balance', type: 'uint256' },
      { name: 'pendingTotal', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

export const TWINKLE_ESCROW_ABI = [
  {
    type: 'function',
    name: 'createProject',
    inputs: [
      { name: 'id', type: 'bytes32' },
      { name: 'client', type: 'address' },
      { name: 'splitAddress', type: 'address' },
      { name: 'disputeResolution', type: 'uint8' },
      { name: 'arbitrator', type: 'address' },
      { name: 'arbitratorFeeBps', type: 'uint16' },
      { name: 'approvalTimeoutDays', type: 'uint16' },
      { name: 'milestoneAmounts', type: 'uint128[]' },
      { name: 'streamDurations', type: 'uint32[]' },
    ],
    outputs: [{ name: 'projectId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'fundProject',
    inputs: [{ name: 'projectId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'requestMilestone',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'milestoneIndex', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approveMilestone',
    inputs: [
      { name: 'projectId', type: 'bytes32' },
      { name: 'milestoneIndex', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getProject',
    inputs: [{ name: 'projectId', type: 'bytes32' }],
    outputs: [
      { name: 'freelancer', type: 'address' },
      { name: 'client', type: 'address' },
      { name: 'status', type: 'uint8' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'fundedAmount', type: 'uint256' },
      { name: 'releasedAmount', type: 'uint256' },
      { name: 'milestoneCount', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

// ===== Helper Functions =====

/**
 * Generate a unique paywall ID from creator and content identifier
 */
export function generatePaywallId(
  creator: `0x${string}`,
  contentId: string
): `0x${string}` {
  return keccak256(
    encodePacked(['address', 'string'], [creator, contentId])
  );
}

/**
 * Generate a random bytes32 value
 */
export function generateRandomBytes32(): `0x${string}` {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return `0x${Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
}

// ===== TwinklePay Contract =====

export async function createPaywall(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    contentId: string;
    price: bigint;
    splitAddress?: `0x${string}`;
    x402Enabled?: boolean;
  }
): Promise<{ hash: `0x${string}`; paywallId: `0x${string}` }> {
  const creator = walletClient.account!.address;
  const paywallId = generatePaywallId(creator, params.contentId);

  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinklePay,
    abi: TWINKLE_PAY_ABI,
    functionName: 'createPaywall',
    args: [
      paywallId,
      params.price,
      params.splitAddress || '0x0000000000000000000000000000000000000000',
      params.x402Enabled ?? true,
    ],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return { hash, paywallId };
}

export async function payForPaywall(
  walletClient: WalletClient,
  publicClient: PublicClient,
  paywallId: `0x${string}`
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinklePay,
    abi: TWINKLE_PAY_ABI,
    functionName: 'pay',
    args: [paywallId],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function getPaywallOnChain(
  publicClient: PublicClient,
  paywallId: `0x${string}`
) {
  const result = await publicClient.readContract({
    address: CONFIG.contracts.TwinklePay,
    abi: TWINKLE_PAY_ABI,
    functionName: 'getPaywall',
    args: [paywallId],
  });

  return {
    creator: result[0],
    price: result[1],
    splitAddress: result[2],
    totalUnlocks: result[3],
    totalRevenue: result[4],
    active: result[5],
    x402Enabled: result[6],
  };
}

export async function isPaywallUnlocked(
  publicClient: PublicClient,
  paywallId: `0x${string}`,
  user: `0x${string}`
): Promise<boolean> {
  return publicClient.readContract({
    address: CONFIG.contracts.TwinklePay,
    abi: TWINKLE_PAY_ABI,
    functionName: 'isUnlocked',
    args: [paywallId, user],
  });
}

// ===== TwinkleX402 Contract =====

export async function createPaymentRequest(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    payTo: `0x${string}`;
    amount: bigint;
    paywallId: `0x${string}`;
    validFor?: number;
  }
): Promise<{ hash: `0x${string}`; requestId: `0x${string}` }> {
  const validFor = params.validFor || CONFIG.defaults.validityPeriod;

  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleX402,
    abi: TWINKLE_X402_ABI,
    functionName: 'createPaymentRequest',
    args: [params.payTo, params.amount, params.paywallId, BigInt(validFor)],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const requestId = generateRandomBytes32();

  return { hash, requestId };
}

export async function getPaymentRequestOnChain(
  publicClient: PublicClient,
  requestId: `0x${string}`
) {
  const result = await publicClient.readContract({
    address: CONFIG.contracts.TwinkleX402,
    abi: TWINKLE_X402_ABI,
    functionName: 'getPaymentRequest',
    args: [requestId],
  });

  return {
    payTo: result[0],
    amount: result[1],
    paywallId: result[2],
    validUntil: result[3],
    settled: result[4],
  };
}

export async function getDomainSeparator(
  publicClient: PublicClient
): Promise<`0x${string}`> {
  return publicClient.readContract({
    address: CONFIG.contracts.TwinkleX402,
    abi: TWINKLE_X402_ABI,
    functionName: 'DOMAIN_SEPARATOR',
  });
}

// ===== TwinkleSubscription Contract =====

export async function createSubscriptionPlan(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    price: bigint;
    interval: number; // in seconds
    gracePeriod?: number; // ignored by contract V5
  }
): Promise<{ hash: `0x${string}`; planId: `0x${string}` }> {
  const planId = generateRandomBytes32();
  const intervalDays = Math.max(1, Math.floor(params.interval / 86400));

  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleSubscription,
    abi: TWINKLE_SUBSCRIPTION_ABI,
    functionName: 'createPlan',
    args: [
      planId,
      params.price,
      intervalDays,
      0, // trialDays
      '0x0000000000000000000000000000000000000000' // splitAddress
    ],
  });

  await publicClient.waitForTransactionReceipt({ hash });

  return { hash, planId };
}

export async function subscribeToPlan(
  walletClient: WalletClient,
  publicClient: PublicClient,
  planId: `0x${string}`
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleSubscription,
    abi: TWINKLE_SUBSCRIPTION_ABI,
    functionName: 'subscribe',
    args: [planId],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function isSubscribedToPlan(
  publicClient: PublicClient,
  planId: `0x${string}`,
  user: `0x${string}`
): Promise<boolean> {
  const subId = await publicClient.readContract({
    address: CONFIG.contracts.TwinkleSubscription,
    abi: TWINKLE_SUBSCRIPTION_ABI,
    functionName: 'userSubscriptions',
    args: [planId, user],
  });

  if (!subId || subId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return false;
  }

  return publicClient.readContract({
    address: CONFIG.contracts.TwinkleSubscription,
    abi: TWINKLE_SUBSCRIPTION_ABI,
    functionName: 'isSubscriptionValid',
    args: [subId],
  });
}

// ===== TwinkleSplit Contract =====

export async function createSplit(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    recipients: `0x${string}`[];
    shares: bigint[];
  }
): Promise<{ hash: `0x${string}`; splitId: `0x${string}` }> {
  const splitId = generateRandomBytes32();

  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleSplit,
    abi: TWINKLE_SPLIT_ABI,
    functionName: 'createSplit',
    args: [
      splitId,
      params.recipients,
      params.shares,
      false // mutable_
    ],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return { hash, splitId };
}

export async function depositToSplit(
  walletClient: WalletClient,
  publicClient: PublicClient,
  splitId: `0x${string}`,
  amount: bigint
): Promise<`0x${string}`> {
  // Use receiveFunds instead of deposit
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleSplit,
    abi: TWINKLE_SPLIT_ABI,
    functionName: 'receiveFunds',
    args: [splitId, amount],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function distributeSplit(
  walletClient: WalletClient,
  publicClient: PublicClient,
  splitId: `0x${string}`,
  recipients: `0x${string}`[],
  percentages: bigint[]
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleSplit,
    abi: TWINKLE_SPLIT_ABI,
    functionName: 'distribute',
    args: [splitId, recipients, percentages],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// ===== TwinkleEscrow Contract =====

export async function createEscrowProject(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    freelancer: `0x${string}`; // This is effectively the caller (msg.sender)
    client?: `0x${string}`; // The funding party
    milestoneAmounts: bigint[];
    milestoneDescriptions: string[]; // ignored
    duration: number; // in seconds
  }
): Promise<{ hash: `0x${string}`; projectId: `0x${string}` }> {
  const projectId = generateRandomBytes32();
  // If client not provided, use a random address to avoid "InvalidClient" (freelancer == client)
  // For demo purposes only. Real usage should provide actual client.
  const client = params.client || '0x1111111111111111111111111111111111111111';

  // Create stream durations array (0 for instant) - simplistic for demo
  const streamDurations = params.milestoneAmounts.map(() => 0);

  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleEscrow,
    abi: TWINKLE_ESCROW_ABI,
    functionName: 'createProject',
    args: [
      projectId,
      client,
      '0x0000000000000000000000000000000000000000', // splitAddress
      0, // disputeResolution: None
      '0x0000000000000000000000000000000000000000', // arbitrator
      0, // fee
      14, // timeout
      params.milestoneAmounts,
      streamDurations // streamDurations
    ],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return { hash, projectId };
}

export async function fundEscrowProject(
  walletClient: WalletClient,
  publicClient: PublicClient,
  projectId: `0x${string}`
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleEscrow,
    abi: TWINKLE_ESCROW_ABI,
    functionName: 'fundProject',
    args: [projectId],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
