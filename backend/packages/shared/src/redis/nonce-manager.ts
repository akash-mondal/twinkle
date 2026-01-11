/**
 * Nonce Manager for Transaction Safety
 * Prevents nonce collisions under concurrent transaction load
 * Uses Redis for distributed locking and tracking
 */

import type { Redis } from "ioredis";
import type { PublicClient, Address } from "viem";

export interface NonceManagerConfig {
  /** Lock timeout in seconds (default: 30) */
  lockTimeout?: number;
  /** Pending nonce expiry in seconds (default: 300) */
  pendingExpiry?: number;
  /** Max retry attempts for acquiring lock (default: 50) */
  maxRetries?: number;
  /** Delay between retries in ms (default: 100) */
  retryDelay?: number;
}

const DEFAULT_CONFIG: Required<NonceManagerConfig> = {
  lockTimeout: 30,
  pendingExpiry: 300,
  maxRetries: 50,
  retryDelay: 100,
};

export class NonceManager {
  private config: Required<NonceManagerConfig>;

  constructor(
    private redis: Redis,
    private publicClient: PublicClient,
    config: NonceManagerConfig = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Acquire the next available nonce for an address
   * Uses distributed locking to prevent race conditions
   */
  async acquireNonce(address: Address): Promise<bigint> {
    const lockKey = `nonce:lock:${address.toLowerCase()}`;
    const pendingKey = `nonce:pending:${address.toLowerCase()}`;

    let retries = 0;

    while (retries < this.config.maxRetries) {
      // Try to acquire lock using SET with NX and EX options
      const lockAcquired = await this.redis.set(
        lockKey,
        "1",
        "EX",
        this.config.lockTimeout,
        "NX"
      );

      if (lockAcquired) {
        try {
          // Get on-chain nonce
          const onChainNonce = await this.publicClient.getTransactionCount({
            address,
            blockTag: "pending",
          });

          // Get our tracked pending nonce
          const pendingNonceStr = await this.redis.get(pendingKey);
          const pendingNonce = pendingNonceStr ? BigInt(pendingNonceStr) : 0n;

          // Use the higher of on-chain or pending nonce
          const nonce =
            pendingNonce > BigInt(onChainNonce)
              ? pendingNonce
              : BigInt(onChainNonce);

          // Store the next pending nonce
          await this.redis.setex(
            pendingKey,
            this.config.pendingExpiry,
            (nonce + 1n).toString()
          );

          return nonce;
        } finally {
          // Always release lock
          await this.redis.del(lockKey);
        }
      }

      // Lock not acquired, wait and retry
      retries++;
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.retryDelay)
      );
    }

    throw new Error(
      `Failed to acquire nonce lock for ${address} after ${this.config.maxRetries} retries`
    );
  }

  /**
   * Release a nonce back to the pool (on transaction failure)
   * Only decrements if the current pending nonce is one higher
   */
  async releaseNonce(address: Address, nonce: bigint): Promise<void> {
    const pendingKey = `nonce:pending:${address.toLowerCase()}`;

    const currentPending = await this.redis.get(pendingKey);
    if (currentPending && BigInt(currentPending) === nonce + 1n) {
      await this.redis.setex(
        pendingKey,
        this.config.pendingExpiry,
        nonce.toString()
      );
    }
  }

  /**
   * Confirm a nonce was used successfully
   * Ensures the pending nonce is at least one higher
   */
  async confirmNonce(address: Address, nonce: bigint): Promise<void> {
    const pendingKey = `nonce:pending:${address.toLowerCase()}`;

    const currentPending = await this.redis.get(pendingKey);
    const pendingNonce = currentPending ? BigInt(currentPending) : 0n;

    if (pendingNonce <= nonce) {
      await this.redis.setex(
        pendingKey,
        this.config.pendingExpiry,
        (nonce + 1n).toString()
      );
    }
  }

  /**
   * Reset the pending nonce to sync with on-chain state
   * Useful after detecting nonce mismatch errors
   */
  async resetNonce(address: Address): Promise<void> {
    const pendingKey = `nonce:pending:${address.toLowerCase()}`;
    await this.redis.del(pendingKey);
  }
}
