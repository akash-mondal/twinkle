/**
 * Settlement Service
 * Executes x402 payment settlements on-chain
 * Production-hardened with nonce management, retry logic, and logging
 */

import {
  createWalletClient,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  decodeEventLog,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import type { Redis } from "ioredis";

import { SEPOLIA_CONTRACTS } from "@twinkle/shared/constants";
import { TwinkleX402Abi } from "@twinkle/shared/abis";
import type { PaymentIntent } from "@twinkle/shared";
import {
  createFallbackPublicClient,
  createFallbackTransport,
  NonceManager,
  createLogger,
  settlementsTotal,
  settlementDuration,
  transactionsTotal,
} from "@twinkle/shared";

const logger = createLogger({ serviceName: "settlement-service" });

export interface SettlementResult {
  success: boolean;
  transactionHash?: Hash;
  accessProofId?: `0x${string}`;
  error?: string;
  gasUsed?: bigint;
  attempts?: number;
}

export interface AgentPaymentInfo {
  agentId: `0x${string}`;
  agentType: string;
  sessionId: `0x${string}`;
  metadata: `0x${string}`;
}

export interface SettlementServiceConfig {
  /** Max retry attempts for failed transactions */
  maxRetries?: number;
  /** Base delay for exponential backoff (ms) */
  baseDelay?: number;
  /** Transaction confirmation timeout (ms) */
  confirmationTimeout?: number;
}

const DEFAULT_CONFIG: Required<SettlementServiceConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  confirmationTimeout: 60_000,
};

export class SettlementService {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private account: PrivateKeyAccount;
  private x402Address: Address;
  private nonceManager: NonceManager | null = null;
  private config: Required<SettlementServiceConfig>;

  constructor(
    privateKey: `0x${string}`,
    redis?: Redis,
    config: SettlementServiceConfig = {}
  ) {
    this.account = privateKeyToAccount(privateKey);
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Create clients with fallback RPC
    this.publicClient = createFallbackPublicClient();

    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: createFallbackTransport(),
    });

    this.x402Address = SEPOLIA_CONTRACTS.TwinkleX402 as Address;

    // Initialize nonce manager if Redis provided
    if (redis) {
      this.nonceManager = new NonceManager(redis, this.publicClient);
      logger.info("Nonce manager initialized");
    } else {
      logger.warn("Redis not provided, nonce manager disabled - concurrent transactions may fail");
    }

    logger.info(
      { facilitator: this.account.address, x402: this.x402Address },
      "Settlement service initialized"
    );
  }

  /**
   * Get the facilitator's address
   */
  get facilitatorAddress(): Address {
    return this.account.address;
  }

  /**
   * Settle a payment on-chain with retry logic
   */
  async settle(
    requestId: `0x${string}`,
    intent: PaymentIntent,
    signature: `0x${string}`
  ): Promise<SettlementResult> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: Error | undefined;

    logger.info(
      { requestId, payer: intent.payer, amount: intent.amount.toString() },
      "Starting settlement"
    );

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      attempts = attempt;

      try {
        // Acquire nonce if manager available
        let nonce: bigint | undefined;
        if (this.nonceManager) {
          nonce = await this.nonceManager.acquireNonce(this.account.address);
          logger.debug({ nonce: nonce.toString(), attempt }, "Acquired nonce");
        }

        // Simulate the transaction first
        const { request } = await this.publicClient.simulateContract({
          address: this.x402Address,
          abi: TwinkleX402Abi,
          functionName: "settle",
          args: [
            requestId,
            {
              payer: intent.payer,
              requestId: intent.requestId,
              amount: intent.amount,
              validUntil: intent.validUntil,
              nonce: intent.nonce,
            },
            signature,
          ],
          account: this.account,
        });

        // Execute the transaction with nonce if available
        const txRequest = nonce !== undefined ? { ...request, nonce: Number(nonce) } : request;
        const hash = await this.walletClient.writeContract(txRequest as typeof request);

        logger.info({ hash, attempt }, "Transaction submitted");

        // Wait for confirmation
        const receipt = await this.publicClient.waitForTransactionReceipt({
          hash,
          timeout: this.config.confirmationTimeout,
          confirmations: 1,
        });

        // Confirm nonce was used
        if (this.nonceManager && nonce !== undefined) {
          await this.nonceManager.confirmNonce(this.account.address, nonce);
        }

        // Extract accessProofId from logs using proper event decoding
        let accessProofId: `0x${string}` | undefined;
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: TwinkleX402Abi,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === "PaymentSettled") {
              // TypeScript knows args structure from ABI
              const args = decoded.args as {
                requestId: `0x${string}`;
                payer: Address;
                accessProofId: `0x${string}`;
              };
              accessProofId = args.accessProofId;
              logger.debug({ accessProofId }, "Extracted accessProofId from event");
              break;
            }
          } catch {
            // Not our event, continue
          }
        }

        const duration = (Date.now() - startTime) / 1000;
        settlementDuration.observe({ status: "success" }, duration);
        settlementsTotal.inc({ status: "success", type: "single" });
        transactionsTotal.inc({ status: "success", type: "settlement" });

        logger.info(
          {
            hash,
            accessProofId,
            gasUsed: receipt.gasUsed.toString(),
            duration,
            attempts,
          },
          "Settlement successful"
        );

        return {
          success: receipt.status === "success",
          transactionHash: hash,
          accessProofId,
          gasUsed: receipt.gasUsed,
          attempts,
        };
      } catch (error) {
        lastError = error as Error;

        // Release nonce on failure
        if (this.nonceManager) {
          const nonce = await this.publicClient.getTransactionCount({
            address: this.account.address,
            blockTag: "pending",
          });
          await this.nonceManager.releaseNonce(this.account.address, BigInt(nonce));
        }

        logger.warn(
          { error: lastError.message, attempt, maxRetries: this.config.maxRetries },
          "Settlement attempt failed"
        );

        // Check if error is retryable
        if (this.isRetryableError(lastError) && attempt < this.config.maxRetries) {
          const delay = this.config.baseDelay * Math.pow(2, attempt - 1);
          logger.info({ delay, nextAttempt: attempt + 1 }, "Retrying after delay");
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    settlementDuration.observe({ status: "failed" }, duration);
    settlementsTotal.inc({ status: "failed", type: "single" });
    transactionsTotal.inc({ status: "failed", type: "settlement" });

    logger.error(
      { requestId, error: lastError?.message, attempts },
      "Settlement failed after all attempts"
    );

    return {
      success: false,
      error: lastError?.message || "Settlement failed",
      attempts,
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      "nonce too low",
      "replacement transaction underpriced",
      "transaction underpriced",
      "already known",
      "ETIMEDOUT",
      "ECONNRESET",
      "ECONNREFUSED",
      "rate limit",
      "429",
      "502",
      "503",
      "504",
    ];

    const message = error.message.toLowerCase();
    return retryablePatterns.some((pattern) =>
      message.includes(pattern.toLowerCase())
    );
  }

  /**
   * Settle with agent payment info (AP2)
   */
  async settleWithAP2(
    requestId: `0x${string}`,
    intent: PaymentIntent,
    signature: `0x${string}`,
    agentInfo: AgentPaymentInfo
  ): Promise<SettlementResult> {
    const startTime = Date.now();

    logger.info(
      { requestId, agentId: agentInfo.agentId, agentType: agentInfo.agentType },
      "Starting AP2 settlement"
    );

    try {
      let nonce: bigint | undefined;
      if (this.nonceManager) {
        nonce = await this.nonceManager.acquireNonce(this.account.address);
      }

      const { request } = await this.publicClient.simulateContract({
        address: this.x402Address,
        abi: TwinkleX402Abi,
        functionName: "settleWithAP2",
        args: [
          requestId,
          {
            payer: intent.payer,
            requestId: intent.requestId,
            amount: intent.amount,
            validUntil: intent.validUntil,
            nonce: intent.nonce,
          },
          signature,
          {
            agentId: agentInfo.agentId,
            agentType: agentInfo.agentType,
            sessionId: agentInfo.sessionId,
            metadata: agentInfo.metadata,
          },
        ],
        account: this.account,
      });

      const txRequest = nonce !== undefined ? { ...request, nonce: Number(nonce) } : request;
      const hash = await this.walletClient.writeContract(txRequest as typeof request);

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout: this.config.confirmationTimeout,
        confirmations: 1,
      });

      if (this.nonceManager && nonce !== undefined) {
        await this.nonceManager.confirmNonce(this.account.address, nonce);
      }

      const duration = (Date.now() - startTime) / 1000;
      settlementsTotal.inc({ status: "success", type: "ap2" });

      logger.info(
        { hash, gasUsed: receipt.gasUsed.toString(), duration },
        "AP2 settlement successful"
      );

      return {
        success: receipt.status === "success",
        transactionHash: hash,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      settlementsTotal.inc({ status: "failed", type: "ap2" });

      logger.error(
        { requestId, error: (error as Error).message },
        "AP2 settlement failed"
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Settlement failed",
      };
    }
  }

  /**
   * Batch settle multiple payments
   */
  async settleBatch(
    settlements: Array<{
      requestId: `0x${string}`;
      intent: PaymentIntent;
      signature: `0x${string}`;
    }>
  ): Promise<SettlementResult> {
    const startTime = Date.now();

    logger.info({ count: settlements.length }, "Starting batch settlement");

    try {
      let nonce: bigint | undefined;
      if (this.nonceManager) {
        nonce = await this.nonceManager.acquireNonce(this.account.address);
      }

      const requestIds = settlements.map((s) => s.requestId);
      const intents = settlements.map((s) => ({
        payer: s.intent.payer,
        requestId: s.intent.requestId,
        amount: s.intent.amount,
        validUntil: s.intent.validUntil,
        nonce: s.intent.nonce,
      }));
      const signatures = settlements.map((s) => s.signature);

      const { request } = await this.publicClient.simulateContract({
        address: this.x402Address,
        abi: TwinkleX402Abi,
        functionName: "settleBatch",
        args: [requestIds, intents, signatures],
        account: this.account,
      });

      const txRequest = nonce !== undefined ? { ...request, nonce: Number(nonce) } : request;
      const hash = await this.walletClient.writeContract(txRequest as typeof request);

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout: this.config.confirmationTimeout,
        confirmations: 1,
      });

      if (this.nonceManager && nonce !== undefined) {
        await this.nonceManager.confirmNonce(this.account.address, nonce);
      }

      const duration = (Date.now() - startTime) / 1000;
      settlementsTotal.inc({ status: "success", type: "batch" });

      logger.info(
        { hash, count: settlements.length, gasUsed: receipt.gasUsed.toString(), duration },
        "Batch settlement successful"
      );

      return {
        success: receipt.status === "success",
        transactionHash: hash,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      settlementsTotal.inc({ status: "failed", type: "batch" });

      logger.error(
        { count: settlements.length, error: (error as Error).message },
        "Batch settlement failed"
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Batch settlement failed",
      };
    }
  }

  /**
   * Get payment request details from contract
   */
  async getPaymentRequest(requestId: `0x${string}`) {
    return this.publicClient.readContract({
      address: this.x402Address,
      abi: TwinkleX402Abi,
      functionName: "getPaymentRequest",
      args: [requestId],
    });
  }

  /**
   * Check if a payment request is valid (not settled, not expired)
   */
  async isRequestValid(requestId: `0x${string}`): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.x402Address,
      abi: TwinkleX402Abi,
      functionName: "isRequestValid",
      args: [requestId],
    });
  }
}

/**
 * Create settlement service from environment
 */
export function createSettlementService(redis?: Redis): SettlementService {
  const privateKey = process.env.FACILITATOR_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("FACILITATOR_PRIVATE_KEY environment variable required");
  }

  return new SettlementService(privateKey as `0x${string}`, redis);
}
