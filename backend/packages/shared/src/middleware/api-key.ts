/**
 * API Key Authentication Middleware
 * Validates API keys with Redis caching
 */

import type { Context, MiddlewareHandler } from "hono";
import type { Redis } from "ioredis";

export interface ApiKeyData {
  id: string;
  name: string;
  permissions: string[];
  rateLimit?: number;
  createdAt: string;
  expiresAt?: string;
}

export interface ApiKeyConfig {
  /** Header name for API key (default: 'x-api-key') */
  headerName?: string;
  /** Cache TTL in seconds (default: 300) */
  cacheTtl?: number;
  /** Function to validate API key against database */
  validateKey?: (key: string) => Promise<ApiKeyData | null>;
  /** Skip authentication for certain paths */
  skipPaths?: string[];
  /** Custom error message */
  errorMessage?: string;
}

const DEFAULT_CONFIG: Partial<ApiKeyConfig> = {
  headerName: "x-api-key",
  cacheTtl: 300,
  errorMessage: "Invalid or missing API key",
};

/**
 * Create API key authentication middleware
 */
export function apiKeyAuth(
  redis: Redis,
  config: ApiKeyConfig = {}
): MiddlewareHandler {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const headerName = mergedConfig.headerName!.toLowerCase();

  return async (c, next) => {
    // Skip authentication for configured paths
    const path = c.req.path;
    if (mergedConfig.skipPaths?.some((p) => path.startsWith(p))) {
      await next();
      return;
    }

    // Get API key from header
    const apiKey = c.req.header(headerName);
    if (!apiKey) {
      return c.json(
        {
          error: "unauthorized",
          message: "API key required",
        },
        401
      );
    }

    // Check Redis cache first
    const cacheKey = `apikey:${apiKey}`;
    const cached = await redis.get(cacheKey);

    let keyData: ApiKeyData | null = null;

    if (cached) {
      try {
        keyData = JSON.parse(cached);
      } catch {
        // Invalid cache entry, will revalidate
      }
    }

    // If not in cache and validator provided, validate against database
    if (!keyData && mergedConfig.validateKey) {
      keyData = await mergedConfig.validateKey(apiKey);

      if (keyData) {
        // Cache the valid key data
        await redis.setex(
          cacheKey,
          mergedConfig.cacheTtl!,
          JSON.stringify(keyData)
        );
      }
    }

    // If still no key data and no validator, check if key exists in cache as "known"
    if (!keyData && !mergedConfig.validateKey) {
      // In dev mode without validator, accept any key format
      if (process.env.NODE_ENV === "development" && apiKey.startsWith("dev_")) {
        keyData = {
          id: "dev",
          name: "Development Key",
          permissions: ["*"],
          createdAt: new Date().toISOString(),
        };
      }
    }

    if (!keyData) {
      return c.json(
        {
          error: "unauthorized",
          message: mergedConfig.errorMessage,
        },
        401
      );
    }

    // Check if key is expired
    if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
      // Remove expired key from cache
      await redis.del(cacheKey);
      return c.json(
        {
          error: "unauthorized",
          message: "API key has expired",
        },
        401
      );
    }

    // Attach key data to context for use in handlers
    c.set("apiKeyData", keyData);
    c.set("apiKeyId", keyData.id);

    await next();
  };
}

/**
 * Get API key data from context (set by apiKeyAuth middleware)
 */
export function getApiKeyData(c: Context): ApiKeyData | undefined {
  return c.get("apiKeyData");
}

/**
 * Check if API key has specific permission
 */
export function hasPermission(c: Context, permission: string): boolean {
  const keyData = getApiKeyData(c);
  if (!keyData) return false;

  return (
    keyData.permissions.includes("*") ||
    keyData.permissions.includes(permission)
  );
}
