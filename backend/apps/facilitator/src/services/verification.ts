/**
 * EIP-712 Verification Service
 * Verifies PaymentIntent signatures against TwinkleX402 contract
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import {
  verifyPaymentIntentSignature,
  recoverPaymentIntentSigner,
  type PaymentIntent,
} from "@twinkle/shared";
import {
  SEPOLIA_CONTRACTS,
  CHAIN_IDS,
  getX402Domain,
} from "@twinkle/shared/constants";

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  recoveredSigner?: `0x${string}`;
}

export interface PaymentPayload {
  x402Version: number;
  scheme: "exact";
  network: string;
  payload: {
    signature: `0x${string}`;
    authorization: {
      payer: `0x${string}`;
      requestId: `0x${string}`;
      amount: string;
      validUntil: string;
      nonce: string;
    };
  };
}

export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  payTo: `0x${string}`;
  maxTimeoutSeconds: number;
  asset: `0x${string}`;
}

export class VerificationService {
  private publicClient: PublicClient;
  private chainId: number;

  constructor(rpcUrl: string, chainId: number = CHAIN_IDS.SEPOLIA) {
    this.chainId = chainId;
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
  }

  /**
   * Verify a PaymentIntent signature
   */
  async verifyPaymentIntent(
    intent: PaymentIntent,
    signature: `0x${string}`
  ): Promise<VerificationResult> {
    try {
      // Verify the signature recovers to the payer address
      const isValid = await verifyPaymentIntentSignature(
        intent,
        signature,
        this.chainId
      );

      if (!isValid) {
        const recoveredSigner = await recoverPaymentIntentSigner(
          intent,
          signature,
          this.chainId
        );

        return {
          valid: false,
          reason: `Signature recovered to ${recoveredSigner}, expected ${intent.payer}`,
          recoveredSigner,
        };
      }

      // Check if intent has expired
      if (BigInt(intent.validUntil) < BigInt(Math.floor(Date.now() / 1000))) {
        return {
          valid: false,
          reason: "PaymentIntent has expired",
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `Signature verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Verify payment payload against requirements (x402 standard)
   */
  async verifyPaymentPayload(
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<VerificationResult> {
    // Validate x402 version
    if (payload.x402Version !== 1) {
      return { valid: false, reason: "Unsupported x402 version" };
    }

    // Validate scheme
    if (payload.scheme !== "exact" || requirements.scheme !== "exact") {
      return { valid: false, reason: "Only 'exact' scheme is supported" };
    }

    // Validate network
    const expectedNetwork = `eip155:${this.chainId}`;
    if (payload.network !== expectedNetwork) {
      return {
        valid: false,
        reason: `Network mismatch: expected ${expectedNetwork}, got ${payload.network}`,
      };
    }

    // Validate asset is MNEE
    if (
      requirements.asset.toLowerCase() !==
      SEPOLIA_CONTRACTS.TestMNEE.toLowerCase()
    ) {
      return { valid: false, reason: "Asset must be MNEE token" };
    }

    // Validate amount meets requirement
    const payloadAmount = BigInt(payload.payload.authorization.amount);
    const requiredAmount = BigInt(requirements.maxAmountRequired);
    if (payloadAmount < requiredAmount) {
      return {
        valid: false,
        reason: `Insufficient amount: ${payloadAmount} < ${requiredAmount}`,
      };
    }

    // Construct PaymentIntent from payload
    const intent: PaymentIntent = {
      payer: payload.payload.authorization.payer,
      requestId: payload.payload.authorization.requestId,
      amount: payloadAmount,
      validUntil: BigInt(payload.payload.authorization.validUntil),
      nonce: BigInt(payload.payload.authorization.nonce),
    };

    // Verify signature
    return this.verifyPaymentIntent(intent, payload.payload.signature);
  }
}

/**
 * Create verification service from environment
 */
export function createVerificationService(): VerificationService {
  const rpcUrl = process.env.RPC_URL || process.env.PONDER_RPC_URL_11155111;
  if (!rpcUrl) {
    throw new Error("RPC_URL or PONDER_RPC_URL_11155111 environment variable required");
  }

  return new VerificationService(rpcUrl);
}
