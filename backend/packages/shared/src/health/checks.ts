/**
 * Health Check Utilities
 * For liveness and readiness probes
 */

import type { Redis } from "ioredis";
import type { PublicClient } from "viem";

export interface HealthCheckResult {
  status: "ok" | "error";
  latency?: number;
  message?: string;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: Record<string, HealthCheckResult>;
}

export interface HealthCheckConfig {
  /** Redis client for cache health check */
  redis?: Redis;
  /** Public client for RPC health check */
  publicClient?: PublicClient;
  /** Database check function */
  checkDatabase?: () => Promise<boolean>;
  /** Custom health checks */
  customChecks?: Record<string, () => Promise<HealthCheckResult>>;
}

// Track service start time
const startTime = Date.now();

/**
 * Check Redis connectivity
 */
async function checkRedis(redis: Redis): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      status: "ok",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Redis connection failed",
    };
  }
}

/**
 * Check RPC connectivity
 */
async function checkRpc(client: PublicClient): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await client.getBlockNumber();
    return {
      status: "ok",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "RPC connection failed",
    };
  }
}

/**
 * Perform all health checks
 */
export async function checkHealth(
  config: HealthCheckConfig = {}
): Promise<HealthStatus> {
  const checks: Record<string, HealthCheckResult> = {};
  let hasError = false;
  let hasDegraded = false;

  // Redis check
  if (config.redis) {
    checks.redis = await checkRedis(config.redis);
    if (checks.redis.status === "error") hasError = true;
  }

  // RPC check
  if (config.publicClient) {
    checks.rpc = await checkRpc(config.publicClient);
    if (checks.rpc.status === "error") hasDegraded = true;
  }

  // Database check
  if (config.checkDatabase) {
    const start = Date.now();
    try {
      const ok = await config.checkDatabase();
      checks.database = {
        status: ok ? "ok" : "error",
        latency: Date.now() - start,
      };
      if (!ok) hasError = true;
    } catch (error) {
      checks.database = {
        status: "error",
        message: error instanceof Error ? error.message : "Database check failed",
      };
      hasError = true;
    }
  }

  // Custom checks
  if (config.customChecks) {
    for (const [name, check] of Object.entries(config.customChecks)) {
      try {
        checks[name] = await check();
        if (checks[name].status === "error") hasDegraded = true;
      } catch (error) {
        checks[name] = {
          status: "error",
          message: error instanceof Error ? error.message : `${name} check failed`,
        };
        hasDegraded = true;
      }
    }
  }

  // Determine overall status
  let status: HealthStatus["status"] = "healthy";
  if (hasError) {
    status = "unhealthy";
  } else if (hasDegraded) {
    status = "degraded";
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };
}

/**
 * Simple liveness check (just returns ok)
 */
export function livenessCheck(): { status: "ok" } {
  return { status: "ok" };
}

/**
 * Create readiness check handler
 */
export function createReadinessCheck(
  config: HealthCheckConfig
): () => Promise<HealthStatus> {
  return () => checkHealth(config);
}
