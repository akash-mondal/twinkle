/**
 * RPC Fallback Client
 * Multi-provider RPC with automatic failover
 */

import {
  createPublicClient,
  createWalletClient,
  fallback,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Account,
  type Transport,
} from "viem";
import { sepolia, mainnet } from "viem/chains";

export interface FallbackClientConfig {
  /** RPC URLs in priority order */
  rpcUrls?: string[];
  /** Timeout per request in ms (default: 10000) */
  timeout?: number;
  /** Retry count per provider (default: 2) */
  retryCount?: number;
  /** Retry delay in ms (default: 150) */
  retryDelay?: number;
  /** Chain to use (default: sepolia) */
  chain?: Chain;
}

const DEFAULT_CONFIG: Omit<Required<FallbackClientConfig>, "rpcUrls"> = {
  timeout: 10_000,
  retryCount: 2,
  retryDelay: 150,
  chain: sepolia,
};

/**
 * Get RPC URLs from environment with fallback chain
 */
function getRpcUrls(chainId: number): string[] {
  const urls: string[] = [];

  // Primary URL
  const primary =
    process.env.RPC_URL_PRIMARY ||
    process.env.RPC_URL ||
    process.env[`PONDER_RPC_URL_${chainId}`];
  if (primary) urls.push(primary);

  // Secondary URL
  const secondary = process.env.RPC_URL_SECONDARY;
  if (secondary) urls.push(secondary);

  // Tertiary URL
  const tertiary = process.env.RPC_URL_TERTIARY;
  if (tertiary) urls.push(tertiary);

  if (urls.length === 0) {
    throw new Error(
      `No RPC URLs configured for chain ${chainId}. Set RPC_URL_PRIMARY or RPC_URL environment variable.`
    );
  }

  return urls;
}

/**
 * Create a fallback transport from multiple RPC URLs
 */
export function createFallbackTransport(
  config: FallbackClientConfig = {}
): Transport {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const rpcUrls = config.rpcUrls || getRpcUrls(mergedConfig.chain.id);

  return fallback(
    rpcUrls.map((url) =>
      http(url, {
        timeout: mergedConfig.timeout,
        retryCount: mergedConfig.retryCount,
        retryDelay: mergedConfig.retryDelay,
      })
    ),
    {
      rank: true, // Enable automatic ranking based on latency
    }
  );
}

/**
 * Create a public client with fallback RPC providers
 */
export function createFallbackPublicClient(
  config: FallbackClientConfig = {}
): PublicClient {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const transport = createFallbackTransport(config);

  return createPublicClient({
    chain: mergedConfig.chain,
    transport,
  });
}

/**
 * Create a wallet client with fallback RPC providers
 */
export function createFallbackWalletClient(
  account: Account,
  config: FallbackClientConfig = {}
): WalletClient {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const transport = createFallbackTransport(config);

  return createWalletClient({
    account,
    chain: mergedConfig.chain,
    transport,
  });
}

/**
 * Get chain by ID
 */
export function getChainById(chainId: number): Chain {
  switch (chainId) {
    case 1:
      return mainnet;
    case 11155111:
      return sepolia;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

// Re-export viem types for convenience
export type { PublicClient, WalletClient, Chain, Account, Transport };
