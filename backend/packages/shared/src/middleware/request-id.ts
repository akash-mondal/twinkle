/**
 * Request ID Middleware
 * Generates and propagates request IDs for distributed tracing
 */

import type { MiddlewareHandler } from "hono";
import { randomUUID } from "crypto";

export interface RequestIdConfig {
  /** Header name for incoming request ID (default: 'x-request-id') */
  headerName?: string;
  /** Generate custom request ID */
  generator?: () => string;
}

const DEFAULT_CONFIG: RequestIdConfig = {
  headerName: "x-request-id",
  generator: () => randomUUID(),
};

/**
 * Create request ID middleware
 * Extracts existing request ID from header or generates a new one
 */
export function requestId(config: RequestIdConfig = {}): MiddlewareHandler {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return async (c, next) => {
    // Get existing request ID from header or generate new one
    const reqId =
      c.req.header(mergedConfig.headerName!) || mergedConfig.generator!();

    // Set on context for logging/tracing
    c.set("requestId", reqId);

    // Set response header
    c.header("X-Request-Id", reqId);

    await next();
  };
}

/**
 * Get request ID from context
 */
export function getRequestId(c: { get: (key: string) => unknown }): string {
  return (c.get("requestId") as string) || "unknown";
}
