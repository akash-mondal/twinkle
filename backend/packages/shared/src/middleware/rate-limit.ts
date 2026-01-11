/**
 * Redis-backed Rate Limiting Middleware
 * Sliding window rate limiter for Hono framework
 */

import type { Context, MiddlewareHandler } from "hono";
import type { Redis } from "ioredis";

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  max: number;
  /** Function to generate rate limit key from context */
  keyGenerator?: (c: Context) => string;
  /** Custom message for rate limit exceeded */
  message?: string;
  /** Skip rate limiting for certain requests */
  skip?: (c: Context) => boolean;
  /** Response status code (default: 429) */
  statusCode?: number;
}

const DEFAULT_CONFIG: Partial<RateLimitConfig> = {
  message: "Too many requests, please try again later",
  statusCode: 429,
};

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  const ip = forwarded?.split(",")[0].trim() || c.req.header("x-real-ip") || "anonymous";
  return `ratelimit:${ip}`;
}

/**
 * Create a rate limiting middleware using Redis
 */
export function rateLimit(
  redis: Redis,
  config: RateLimitConfig
): MiddlewareHandler {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const keyGen = config.keyGenerator || defaultKeyGenerator;

  return async (c, next) => {
    // Skip if configured
    if (mergedConfig.skip?.(c)) {
      await next();
      return;
    }

    const key = keyGen(c);
    const now = Date.now();
    const windowStart = now - mergedConfig.windowMs;

    // Use Redis sorted set for sliding window
    const multi = redis.multi();

    // Remove old entries outside the window
    multi.zremrangebyscore(key, 0, windowStart);
    // Add current request
    multi.zadd(key, now, `${now}-${Math.random()}`);
    // Count requests in window
    multi.zcard(key);
    // Set expiry on the key
    multi.pexpire(key, mergedConfig.windowMs);

    const results = await multi.exec();
    const count = results?.[2]?.[1] as number || 0;

    // Calculate remaining requests
    const remaining = Math.max(0, mergedConfig.max - count);
    const resetTime = Math.ceil((now + mergedConfig.windowMs) / 1000);

    // Set rate limit headers
    c.header("X-RateLimit-Limit", mergedConfig.max.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", resetTime.toString());

    // Check if rate limit exceeded
    if (count > mergedConfig.max) {
      c.header("Retry-After", Math.ceil(mergedConfig.windowMs / 1000).toString());
      return c.json(
        {
          error: "rate_limit_exceeded",
          message: mergedConfig.message,
          retryAfter: Math.ceil(mergedConfig.windowMs / 1000),
        },
        mergedConfig.statusCode as 429
      );
    }

    await next();
  };
}

/**
 * Create a simpler counter-based rate limiter (less accurate but faster)
 */
export function simplRateLimit(
  redis: Redis,
  config: RateLimitConfig
): MiddlewareHandler {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const keyGen = config.keyGenerator || defaultKeyGenerator;

  return async (c, next) => {
    if (mergedConfig.skip?.(c)) {
      await next();
      return;
    }

    const key = keyGen(c);
    const count = await redis.incr(key);

    // Set expiry on first request
    if (count === 1) {
      await redis.pexpire(key, mergedConfig.windowMs);
    }

    const remaining = Math.max(0, mergedConfig.max - count);
    const ttl = await redis.pttl(key);
    const resetTime = Math.ceil((Date.now() + Math.max(0, ttl)) / 1000);

    c.header("X-RateLimit-Limit", mergedConfig.max.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", resetTime.toString());

    if (count > mergedConfig.max) {
      c.header("Retry-After", Math.ceil(Math.max(0, ttl) / 1000).toString());
      return c.json(
        {
          error: "rate_limit_exceeded",
          message: mergedConfig.message,
          retryAfter: Math.ceil(Math.max(0, ttl) / 1000),
        },
        mergedConfig.statusCode as 429
      );
    }

    await next();
  };
}
