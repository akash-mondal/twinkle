/**
 * Subscription Tools for MCP Server
 * Uses RPC fallback for improved reliability
 */

import { z } from "zod";
import { formatUnits, type Address } from "viem";

import { getContracts, getCurrentChainId, type SupportedChainId } from "@twinkle/shared/constants";
import { TwinkleSubscriptionAbi } from "@twinkle/shared/abis";
import { createFallbackPublicClient, getChainById, createLogger } from "@twinkle/shared";

// Get chain configuration
const chainId = getCurrentChainId();
const chain = getChainById(chainId);
const contracts = getContracts(chainId as SupportedChainId);

// Create logger for subscription tools
const logger = createLogger({
  serviceName: "mcp-subscription-tools",
  level: process.env.LOG_LEVEL || "warn", // Quiet by default for MCP
});

// Tool input schemas
export const getPlanSchema = z.object({
  planId: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .describe("Subscription plan ID"),
});

export const checkSubscriptionSchema = z.object({
  planId: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .describe("Subscription plan ID"),
  userAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("User address to check subscription for"),
});

export const getSubscriptionSchema = z.object({
  subId: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .describe("Subscription ID"),
});

// Create client with RPC fallback
let _client: ReturnType<typeof createFallbackPublicClient> | null = null;

function getClient() {
  if (!_client) {
    logger.debug({ chainId, network: chainId === 1 ? 'mainnet' : 'sepolia' }, "Creating RPC fallback client");
    _client = createFallbackPublicClient({ chain });
  }
  return _client;
}

/**
 * Get subscription plan details
 */
export async function getPlan(planId: string): Promise<{
  exists: boolean;
  creator?: string;
  price?: string;
  intervalDays?: number;
  trialDays?: number;
  active?: boolean;
  subscriberCount?: number;
}> {
  const client = getClient();

  logger.debug({ planId }, "Getting plan details");

  try {
    const result = await client.readContract({
      address: contracts.TwinkleSubscription as Address,
      abi: TwinkleSubscriptionAbi,
      functionName: "getPlan",
      args: [planId as `0x${string}`],
    });

    logger.debug({ planId, creator: result[0] }, "Plan found");

    return {
      exists: true,
      creator: result[0],
      price: formatUnits(result[1], 18),
      intervalDays: Number(result[2]),
      trialDays: Number(result[3]),
      active: result[4],
      subscriberCount: Number(result[5]),
    };
  } catch (error) {
    logger.warn({ planId, error }, "Plan not found");
    return { exists: false };
  }
}

/**
 * Check if user has active subscription to a plan
 */
export async function hasValidSubscription(
  planId: string,
  userAddress: string
): Promise<{ valid: boolean; subscriptionId?: string }> {
  const client = getClient();

  logger.debug({ planId, userAddress }, "Checking subscription validity");

  try {
    const isValid = await client.readContract({
      address: contracts.TwinkleSubscription as Address,
      abi: TwinkleSubscriptionAbi,
      functionName: "hasValidSubscription",
      args: [planId as `0x${string}`, userAddress as Address],
    });

    if (isValid) {
      const subId = await client.readContract({
        address: contracts.TwinkleSubscription as Address,
        abi: TwinkleSubscriptionAbi,
        functionName: "getUserSubscription",
        args: [planId as `0x${string}`, userAddress as Address],
      });

      logger.debug({ planId, userAddress, subscriptionId: subId }, "Valid subscription found");
      return { valid: true, subscriptionId: subId };
    }

    logger.debug({ planId, userAddress }, "No valid subscription");
    return { valid: false };
  } catch (error) {
    logger.warn({ planId, userAddress, error }, "Error checking subscription");
    return { valid: false };
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subId: string): Promise<{
  exists: boolean;
  planId?: string;
  subscriber?: string;
  startedAt?: string;
  currentPeriodEnd?: string;
  active?: boolean;
  cancelled?: boolean;
}> {
  const client = getClient();

  logger.debug({ subId }, "Getting subscription details");

  try {
    const result = await client.readContract({
      address: contracts.TwinkleSubscription as Address,
      abi: TwinkleSubscriptionAbi,
      functionName: "getSubscription",
      args: [subId as `0x${string}`],
    });

    logger.debug({ subId, subscriber: result[1], active: result[4] }, "Subscription found");

    return {
      exists: true,
      planId: result[0],
      subscriber: result[1],
      startedAt: new Date(Number(result[2]) * 1000).toISOString(),
      currentPeriodEnd: new Date(Number(result[3]) * 1000).toISOString(),
      active: result[4],
      cancelled: result[5],
    };
  } catch (error) {
    logger.warn({ subId, error }, "Subscription not found");
    return { exists: false };
  }
}
