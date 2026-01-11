/**
 * Payment Tools for MCP Server
 * Provides AI agents with MNEE payment capabilities
 * Uses RPC fallback for improved reliability
 */

import { z } from "zod";
import { formatUnits, parseUnits, type Address } from "viem";

import { SEPOLIA_CONTRACTS, CHAIN_IDS } from "@twinkle/shared/constants";
import { TwinklePayAbi, TwinkleX402Abi } from "@twinkle/shared/abis";
import { createFallbackPublicClient, createLogger } from "@twinkle/shared";

// Create logger for payment tools (logs to stderr for MCP compatibility)
const logger = createLogger({
  serviceName: "mcp-payment-tools",
  level: process.env.LOG_LEVEL || "warn", // Quiet by default for MCP
});

// MNEE ABI for balance checks
const MNEE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "symbol",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

// Tool input schemas
export const checkBalanceSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("Ethereum address to check balance for"),
});

export const getPaywallSchema = z.object({
  paywallId: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .describe("Paywall ID (bytes32 hex string)"),
});

export const checkUnlockSchema = z.object({
  paywallId: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .describe("Paywall ID to check"),
  userAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("User address to check unlock status for"),
});

export const createPaymentIntentSchema = z.object({
  payerAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("Address that will pay"),
  recipientAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("Address to receive payment"),
  amount: z.string().describe("Amount in MNEE (e.g., '10.5')"),
  paywallId: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional()
    .describe("Optional paywall ID to unlock"),
});

export const getPaymentRequestSchema = z.object({
  requestId: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .describe("Payment request ID"),
});

// Create client with RPC fallback
let _client: ReturnType<typeof createFallbackPublicClient> | null = null;

function getClient() {
  if (!_client) {
    logger.debug("Creating RPC fallback client");
    _client = createFallbackPublicClient();
  }
  return _client;
}

/**
 * Check MNEE balance for an address
 */
export async function checkBalance(
  address: string
): Promise<{ balance: string; symbol: string; raw: string }> {
  const client = getClient();

  logger.debug({ address }, "Checking balance");

  const [balance, symbol, decimals] = await Promise.all([
    client.readContract({
      address: SEPOLIA_CONTRACTS.TestMNEE as Address,
      abi: MNEE_ABI,
      functionName: "balanceOf",
      args: [address as Address],
    }),
    client.readContract({
      address: SEPOLIA_CONTRACTS.TestMNEE as Address,
      abi: MNEE_ABI,
      functionName: "symbol",
    }),
    client.readContract({
      address: SEPOLIA_CONTRACTS.TestMNEE as Address,
      abi: MNEE_ABI,
      functionName: "decimals",
    }),
  ]);

  const formatted = formatUnits(balance, decimals);
  logger.debug({ address, balance: formatted, symbol }, "Balance check complete");

  return {
    balance: formatted,
    symbol,
    raw: balance.toString(),
  };
}

/**
 * Get paywall details
 */
export async function getPaywall(paywallId: string): Promise<{
  exists: boolean;
  creator?: string;
  price?: string;
  active?: boolean;
  x402Enabled?: boolean;
  totalUnlocks?: number;
  totalRevenue?: string;
  splitAddress?: string;
}> {
  const client = getClient();

  logger.debug({ paywallId }, "Getting paywall details");

  const result = await client.readContract({
    address: SEPOLIA_CONTRACTS.TwinklePay as Address,
    abi: TwinklePayAbi,
    functionName: "getPaywall",
    args: [paywallId as `0x${string}`],
  });

  // Check if paywall exists by verifying creator is not zero address
  const creator = result[0];
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  if (creator === zeroAddress) {
    logger.debug({ paywallId }, "Paywall does not exist");
    return { exists: false };
  }

  logger.debug({ paywallId, creator }, "Paywall found");

  return {
    exists: true,
    creator: result[0],
    price: formatUnits(result[1], 18),
    splitAddress: result[2],
    totalUnlocks: Number(result[3]),
    totalRevenue: formatUnits(result[4], 18),
    active: result[5],
    x402Enabled: result[6],
  };
}

/**
 * Check if user has unlocked a paywall
 */
export async function checkUnlock(
  paywallId: string,
  userAddress: string
): Promise<{ unlocked: boolean }> {
  const client = getClient();

  logger.debug({ paywallId, userAddress }, "Checking unlock status");

  const unlocked = await client.readContract({
    address: SEPOLIA_CONTRACTS.TwinklePay as Address,
    abi: TwinklePayAbi,
    functionName: "isUnlocked",
    args: [paywallId as `0x${string}`, userAddress as Address],
  });

  logger.debug({ paywallId, userAddress, unlocked }, "Unlock check complete");

  return { unlocked };
}

/**
 * Create payment intent data for signing
 * Returns the data needed for the user to sign
 */
export async function createPaymentIntent(
  payerAddress: string,
  recipientAddress: string,
  amount: string,
  paywallId?: string
): Promise<{
  intentData: {
    payer: string;
    requestId: string;
    amount: string;
    validUntil: string;
    nonce: string;
  };
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: Record<string, Array<{ name: string; type: string }>>;
  message: string;
}> {
  logger.debug({ payerAddress, recipientAddress, amount, paywallId }, "Creating payment intent");

  // Generate request ID (would normally come from createPaymentRequest)
  const requestId = `0x${Buffer.from(
    JSON.stringify({
      payer: payerAddress,
      recipient: recipientAddress,
      amount,
      timestamp: Date.now(),
    })
  )
    .toString("hex")
    .padEnd(64, "0")
    .slice(0, 64)}` as `0x${string}`;

  const amountWei = parseUnits(amount, 18);
  const validUntil = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour validity
  const nonce = BigInt(Date.now());

  const intentData = {
    payer: payerAddress,
    requestId,
    amount: amountWei.toString(),
    validUntil: validUntil.toString(),
    nonce: nonce.toString(),
  };

  const domain = {
    name: "TwinkleX402",
    version: "2",
    chainId: CHAIN_IDS.SEPOLIA,
    verifyingContract: SEPOLIA_CONTRACTS.TwinkleX402,
  };

  const types = {
    PaymentIntent: [
      { name: "payer", type: "address" },
      { name: "requestId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "validUntil", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };

  logger.debug({ requestId, amount: amountWei.toString() }, "Payment intent created");

  return {
    intentData,
    domain,
    types,
    message: `Sign to authorize payment of ${amount} MNEE to ${recipientAddress}`,
  };
}

/**
 * Get payment request details
 */
export async function getPaymentRequest(requestId: string): Promise<{
  exists: boolean;
  payTo?: string;
  amount?: string;
  paywallId?: string;
  validUntil?: string;
  settled?: boolean;
}> {
  const client = getClient();

  logger.debug({ requestId }, "Getting payment request");

  try {
    const result = await client.readContract({
      address: SEPOLIA_CONTRACTS.TwinkleX402 as Address,
      abi: TwinkleX402Abi,
      functionName: "getPaymentRequest",
      args: [requestId as `0x${string}`],
    });

    logger.debug({ requestId, payTo: result[0], settled: result[4] }, "Payment request found");

    return {
      exists: true,
      payTo: result[0],
      amount: formatUnits(result[1], 18),
      paywallId: result[2],
      validUntil: result[3].toString(),
      settled: result[4],
    };
  } catch (error) {
    logger.warn({ requestId, error }, "Payment request not found");
    return { exists: false };
  }
}
