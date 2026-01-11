/**
 * Redis Client for Twinkle Backend
 * Provides connection pooling and retry strategies
 */

import Redis from "ioredis";

export interface RedisConfig {
  url?: string;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

const DEFAULT_CONFIG: RedisConfig = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

/**
 * Create a configured Redis client instance
 */
export function createRedisClient(config: RedisConfig = {}): Redis {
  const url = config.url || process.env.REDIS_URL || "redis://localhost:6379";
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const client = new Redis(url, {
    maxRetriesPerRequest: mergedConfig.maxRetriesPerRequest,
    enableReadyCheck: mergedConfig.enableReadyCheck,
    lazyConnect: mergedConfig.lazyConnect,
    retryStrategy: (times: number) => {
      if (times > 10) {
        return null; // Stop retrying after 10 attempts
      }
      return Math.min(times * 50, 2000); // Exponential backoff capped at 2s
    },
    reconnectOnError: (err: Error) => {
      const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  return client;
}

// Singleton instance for convenience
let _redis: Redis | null = null;

/**
 * Get or create the singleton Redis client
 */
export function getRedisClient(): Redis {
  if (!_redis) {
    _redis = createRedisClient();
  }
  return _redis;
}

/**
 * Close the singleton Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}

export { Redis };
