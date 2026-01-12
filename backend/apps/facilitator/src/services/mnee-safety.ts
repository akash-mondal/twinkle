/**
 * MNEE Safety Checks Service
 * Verifies MNEE token status before transactions
 */

import {
  createPublicClient,
  http,
  type PublicClient,
  type Address,
} from "viem";
import { getChainById } from "@twinkle/shared";
import { getContracts, getCurrentChainId, type SupportedChainId } from "@twinkle/shared/constants";

// Minimal MNEE ABI for safety checks
const MNEE_ABI = [
  {
    name: "paused",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "blacklisted",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "frozen",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export interface MNEESafetyResult {
  safe: boolean;
  reason?: string;
  details: {
    paused: boolean;
    payerBlacklisted: boolean;
    payerFrozen: boolean;
    recipientBlacklisted: boolean;
    recipientFrozen: boolean;
    balance: bigint;
    allowance: bigint;
  };
}

export class MNEESafetyService {
  private publicClient: PublicClient;
  private mneeAddress: Address;
  private x402Address: Address;
  private chainId: number;

  constructor(rpcUrl: string, chainId?: number) {
    this.chainId = chainId ?? getCurrentChainId();
    const chain = getChainById(this.chainId);
    const contracts = getContracts(this.chainId as SupportedChainId);

    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    // Use MNEE on mainnet, TestMNEE on testnet
    this.mneeAddress = (this.chainId === 1 ? contracts.MNEE : contracts.TestMNEE) as Address;
    this.x402Address = contracts.TwinkleX402 as Address;
  }

  /**
   * Perform all safety checks for a payment
   */
  async checkPaymentSafety(
    payer: Address,
    recipient: Address,
    amount: bigint
  ): Promise<MNEESafetyResult> {
    try {
      // Batch read all required data
      const [
        paused,
        payerBlacklisted,
        payerFrozen,
        recipientBlacklisted,
        recipientFrozen,
        balance,
        allowance,
      ] = await Promise.all([
        this.publicClient.readContract({
          address: this.mneeAddress,
          abi: MNEE_ABI,
          functionName: "paused",
        }),
        this.publicClient.readContract({
          address: this.mneeAddress,
          abi: MNEE_ABI,
          functionName: "blacklisted",
          args: [payer],
        }),
        this.publicClient.readContract({
          address: this.mneeAddress,
          abi: MNEE_ABI,
          functionName: "frozen",
          args: [payer],
        }),
        this.publicClient.readContract({
          address: this.mneeAddress,
          abi: MNEE_ABI,
          functionName: "blacklisted",
          args: [recipient],
        }),
        this.publicClient.readContract({
          address: this.mneeAddress,
          abi: MNEE_ABI,
          functionName: "frozen",
          args: [recipient],
        }),
        this.publicClient.readContract({
          address: this.mneeAddress,
          abi: MNEE_ABI,
          functionName: "balanceOf",
          args: [payer],
        }),
        this.publicClient.readContract({
          address: this.mneeAddress,
          abi: MNEE_ABI,
          functionName: "allowance",
          args: [payer, this.x402Address],
        }),
      ]);

      const details = {
        paused,
        payerBlacklisted,
        payerFrozen,
        recipientBlacklisted,
        recipientFrozen,
        balance,
        allowance,
      };

      // Check for issues
      if (paused) {
        return { safe: false, reason: "MNEE token is paused", details };
      }

      if (payerBlacklisted) {
        return { safe: false, reason: "Payer is blacklisted", details };
      }

      if (payerFrozen) {
        return { safe: false, reason: "Payer account is frozen", details };
      }

      if (recipientBlacklisted) {
        return { safe: false, reason: "Recipient is blacklisted", details };
      }

      if (recipientFrozen) {
        return { safe: false, reason: "Recipient account is frozen", details };
      }

      if (balance < amount) {
        return {
          safe: false,
          reason: `Insufficient balance: ${balance} < ${amount}`,
          details,
        };
      }

      if (allowance < amount) {
        return {
          safe: false,
          reason: `Insufficient allowance: ${allowance} < ${amount}`,
          details,
        };
      }

      return { safe: true, details };
    } catch (error) {
      return {
        safe: false,
        reason: `Safety check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: {
          paused: false,
          payerBlacklisted: false,
          payerFrozen: false,
          recipientBlacklisted: false,
          recipientFrozen: false,
          balance: 0n,
          allowance: 0n,
        },
      };
    }
  }

  /**
   * Check if token is paused
   */
  async isTokenPaused(): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.mneeAddress,
      abi: MNEE_ABI,
      functionName: "paused",
    });
  }

  /**
   * Check if address is blacklisted
   */
  async isBlacklisted(address: Address): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.mneeAddress,
      abi: MNEE_ABI,
      functionName: "blacklisted",
      args: [address],
    });
  }
}

/**
 * Create MNEE safety service from environment
 */
export function createMNEESafetyService(): MNEESafetyService {
  const chainId = getCurrentChainId();
  const rpcUrl = process.env.RPC_URL || process.env[`PONDER_RPC_URL_${chainId}`];
  if (!rpcUrl) {
    throw new Error(`RPC_URL or PONDER_RPC_URL_${chainId} environment variable required`);
  }

  return new MNEESafetyService(rpcUrl, chainId);
}
