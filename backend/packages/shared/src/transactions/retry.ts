/**
 * Transaction Retry Utility
 * Handles transaction submission with exponential backoff
 */

import type { Hash, PublicClient, WalletClient, WriteContractParameters } from "viem";
import { getLogger } from "../logging/logger.js";
import { transactionRetries, transactionsTotal } from "../metrics/registry.js";

const logger = getLogger();

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in ms (default: 30000) */
  maxDelay?: number;
  /** Transaction confirmation timeout in ms (default: 60000) */
  confirmationTimeout?: number;
  /** Number of confirmations to wait for (default: 1) */
  confirmations?: number;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30_000,
  confirmationTimeout: 60_000,
  confirmations: 1,
};

export interface TransactionResult {
  hash: Hash;
  status: "success" | "reverted";
  blockNumber: bigint;
  gasUsed: bigint;
  attempts: number;
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: Error): boolean {
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
  return retryablePatterns.some((pattern) => message.includes(pattern.toLowerCase()));
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const delay = config.baseDelay * Math.pow(2, attempt - 1);
  // Add jitter (0-25% of delay)
  const jitter = delay * Math.random() * 0.25;
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Submit a transaction with retry logic
 */
export async function submitWithRetry<T extends WriteContractParameters>(
  walletClient: WalletClient,
  publicClient: PublicClient,
  request: T,
  config: RetryConfig = {}
): Promise<TransactionResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;
  let attempts = 0;

  for (let attempt = 1; attempt <= mergedConfig.maxAttempts; attempt++) {
    attempts = attempt;

    try {
      logger.debug(
        { attempt, maxAttempts: mergedConfig.maxAttempts },
        "Submitting transaction"
      );

      // Submit transaction
      const hash = await walletClient.writeContract(request as any);

      logger.info({ hash, attempt }, "Transaction submitted, waiting for confirmation");

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: mergedConfig.confirmationTimeout,
        confirmations: mergedConfig.confirmations,
      });

      const result: TransactionResult = {
        hash,
        status: receipt.status === "success" ? "success" : "reverted",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        attempts,
      };

      if (receipt.status === "success") {
        transactionsTotal.inc({ status: "success", type: "contract_write" });
        logger.info(
          { hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() },
          "Transaction confirmed"
        );
        return result;
      }

      // Transaction reverted
      transactionsTotal.inc({ status: "reverted", type: "contract_write" });
      logger.warn({ hash }, "Transaction reverted");
      throw new Error(`Transaction reverted: ${hash}`);

    } catch (error) {
      lastError = error as Error;

      logger.warn(
        { attempt, error: lastError.message },
        "Transaction attempt failed"
      );

      // Check if we should retry
      if (attempt < mergedConfig.maxAttempts && isRetryableError(lastError)) {
        const delay = calculateDelay(attempt, mergedConfig);
        transactionRetries.inc({ reason: "retryable_error" });

        logger.info(
          { delay, nextAttempt: attempt + 1 },
          "Retrying transaction after delay"
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Non-retryable error or max attempts reached
      break;
    }
  }

  transactionsTotal.inc({ status: "failed", type: "contract_write" });
  logger.error(
    { error: lastError?.message, attempts },
    "Transaction failed after all attempts"
  );

  throw lastError || new Error("Transaction failed");
}

/**
 * Submit a raw transaction with retry logic
 */
export async function submitRawWithRetry(
  walletClient: WalletClient,
  publicClient: PublicClient,
  rawTx: `0x${string}`,
  config: RetryConfig = {}
): Promise<TransactionResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;
  let attempts = 0;

  for (let attempt = 1; attempt <= mergedConfig.maxAttempts; attempt++) {
    attempts = attempt;

    try {
      const hash = await walletClient.sendRawTransaction({
        serializedTransaction: rawTx,
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: mergedConfig.confirmationTimeout,
        confirmations: mergedConfig.confirmations,
      });

      return {
        hash,
        status: receipt.status === "success" ? "success" : "reverted",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        attempts,
      };

    } catch (error) {
      lastError = error as Error;

      if (attempt < mergedConfig.maxAttempts && isRetryableError(lastError)) {
        const delay = calculateDelay(attempt, mergedConfig);
        transactionRetries.inc({ reason: "retryable_error" });
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      break;
    }
  }

  throw lastError || new Error("Raw transaction failed");
}
