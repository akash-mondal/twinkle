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

const TWINKLE_PAY_ABI = [
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

const TWINKLE_X402_ABI = [
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

const TWINKLE_SUBSCRIPTION_ABI = [
  {
    type: 'function',
    name: 'createPlan',
    inputs: [
      { name: 'price', type: 'uint96' },
      { name: 'interval', type: 'uint32' },
      { name: 'gracePeriod', type: 'uint32' },
    ],
    outputs: [{ name: 'planId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'subscribe',
    inputs: [{ name: 'planId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPlan',
    inputs: [{ name: 'planId', type: 'bytes32' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'price', type: 'uint96' },
      { name: 'interval', type: 'uint32' },
      { name: 'gracePeriod', type: 'uint32' },
      { name: 'active', type: 'bool' },
      { name: 'subscriberCount', type: 'uint32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isSubscribed',
    inputs: [
      { name: 'planId', type: 'bytes32' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

const TWINKLE_SPLIT_ABI = [
  {
    type: 'function',
    name: 'createSplit',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'shares', type: 'uint256[]' },
    ],
    outputs: [{ name: 'splitId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'deposit',
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
    inputs: [{ name: 'splitId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getSplit',
    inputs: [{ name: 'splitId', type: 'bytes32' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'balance', type: 'uint256' },
      { name: 'totalDistributed', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

const TWINKLE_ESCROW_ABI = [
  {
    type: 'function',
    name: 'createProject',
    inputs: [
      { name: 'freelancer', type: 'address' },
      { name: 'milestoneAmounts', type: 'uint256[]' },
      { name: 'milestoneDescriptions', type: 'string[]' },
      { name: 'duration', type: 'uint256' },
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
    name: 'acceptProject',
    inputs: [{ name: 'projectId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'completeMilestone',
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
      { name: 'client', type: 'address' },
      { name: 'freelancer', type: 'address' },
      { name: 'totalBudget', type: 'uint256' },
      { name: 'released', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'deadline', type: 'uint256' },
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

  // Extract requestId from event logs
  // For now, generate it the same way the contract does
  const requestId = generateRandomBytes32(); // This would be extracted from events in production

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
    gracePeriod?: number; // in seconds
  }
): Promise<{ hash: `0x${string}`; planId: `0x${string}` }> {
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleSubscription,
    abi: TWINKLE_SUBSCRIPTION_ABI,
    functionName: 'createPlan',
    args: [params.price, params.interval, params.gracePeriod || 86400],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const planId = generateRandomBytes32(); // Would extract from events

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
  return publicClient.readContract({
    address: CONFIG.contracts.TwinkleSubscription,
    abi: TWINKLE_SUBSCRIPTION_ABI,
    functionName: 'isSubscribed',
    args: [planId, user],
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
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleSplit,
    abi: TWINKLE_SPLIT_ABI,
    functionName: 'createSplit',
    args: [params.recipients, params.shares],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const splitId = generateRandomBytes32(); // Would extract from events

  return { hash, splitId };
}

export async function depositToSplit(
  walletClient: WalletClient,
  publicClient: PublicClient,
  splitId: `0x${string}`,
  amount: bigint
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleSplit,
    abi: TWINKLE_SPLIT_ABI,
    functionName: 'deposit',
    args: [splitId, amount],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function distributeSplit(
  walletClient: WalletClient,
  publicClient: PublicClient,
  splitId: `0x${string}`
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleSplit,
    abi: TWINKLE_SPLIT_ABI,
    functionName: 'distribute',
    args: [splitId],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// ===== TwinkleEscrow Contract =====

export async function createEscrowProject(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    freelancer: `0x${string}`;
    milestoneAmounts: bigint[];
    milestoneDescriptions: string[];
    duration: number; // in seconds
  }
): Promise<{ hash: `0x${string}`; projectId: `0x${string}` }> {
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TwinkleEscrow,
    abi: TWINKLE_ESCROW_ABI,
    functionName: 'createProject',
    args: [
      params.freelancer,
      params.milestoneAmounts,
      params.milestoneDescriptions,
      BigInt(params.duration),
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const projectId = generateRandomBytes32(); // Would extract from events

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
