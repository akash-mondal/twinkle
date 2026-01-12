/**
 * Twinkle REST API
 * Provides read access to indexed blockchain data
 * Production-hardened with Redis, logging, rate limiting, and health checks
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { prettyJSON } from "hono/pretty-json";

import {
  payments,
  paywalls,
  subscriptions,
  projects,
  splits,
  x402,
  analytics,
} from "./modules/index.js";
import { checkDatabase } from "./db.js";
import { getContracts, getCurrentChainId, type SupportedChainId } from "@twinkle/shared/constants";
import {
  createRedisClient,
  createLogger,
  rateLimit,
  requestId as requestIdMiddleware,
  getRequestId,
  checkHealth,
  registry,
  httpRequestDuration,
  httpRequestTotal,
  initSentry,
  captureError,
  initTracing,
} from "@twinkle/shared";

// Get chain configuration from environment
const chainId = getCurrentChainId();
const contracts = getContracts(chainId as SupportedChainId);
const networkName = chainId === 1 ? 'Mainnet' : 'Sepolia';

// Initialize observability first
initTracing({ serviceName: "api" });
initSentry({ serviceName: "api" });

// Create logger
const logger = createLogger({ serviceName: "api" });

// Initialize Redis
const redis = createRedisClient();

// Create Hono app
const app = new Hono();

// Middleware - order matters
app.use("*", requestIdMiddleware());
app.use("*", cors());
app.use("*", secureHeaders());
app.use("*", prettyJSON());

// Rate limiting - skip health and metrics endpoints
app.use("*", async (c, next) => {
  const path = c.req.path;
  if (path === "/health" || path === "/metrics" || path === "/") {
    await next();
    return;
  }
  return rateLimit(redis, {
    windowMs: 60_000, // 1 minute
    max: 200, // Higher limit for read API
    keyGenerator: (ctx) => {
      const forwarded = ctx.req.header("x-forwarded-for");
      const ip = forwarded?.split(",")[0].trim() || ctx.req.header("x-real-ip") || "anonymous";
      return `api:ratelimit:${ip}`;
    },
  })(c, next);
});

// Request logging and metrics middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  const reqId = getRequestId(c);

  logger.info(
    { reqId, method: c.req.method, path: c.req.path },
    "Request started"
  );

  await next();

  const duration = (Date.now() - start) / 1000;
  const status = c.res.status;
  const route = c.req.routePath || c.req.path;

  // Record metrics
  httpRequestDuration.observe(
    { method: c.req.method, route, status_code: status.toString() },
    duration
  );
  httpRequestTotal.inc({
    method: c.req.method,
    route,
    status_code: status.toString(),
  });

  logger.info(
    { reqId, method: c.req.method, path: c.req.path, status, duration },
    "Request completed"
  );
});

// Root endpoint - quick status
app.get("/", async (c) => {
  const dbHealthy = await checkDatabase();

  return c.json({
    service: "twinkle-api",
    version: "1.0.0",
    status: dbHealthy ? "healthy" : "degraded",
    database: dbHealthy ? "connected" : "disconnected",
    chainId,
    network: networkName,
    contracts: {
      TwinkleCore: contracts.TwinkleCore,
      TwinklePay: contracts.TwinklePay,
      TwinkleSubscription: contracts.TwinkleSubscription,
      TwinkleEscrow: contracts.TwinkleEscrow,
      TwinkleSplit: contracts.TwinkleSplit,
      TwinkleX402: contracts.TwinkleX402,
    },
  });
});

// Health check endpoint with dependency status
app.get("/health", async (c) => {
  const health = await checkHealth({
    redis,
    checkDatabase: async () => {
      return await checkDatabase();
    },
  });
  const statusCode = health.status === "healthy" ? 200 : 503;

  return c.json(
    {
      ...health,
      service: "api",
    },
    statusCode
  );
});

// Prometheus metrics endpoint
app.get("/metrics", async (c) => {
  const metrics = await registry.metrics();
  return c.text(metrics, 200, {
    "Content-Type": registry.contentType,
  });
});

// Mount API routes
app.route("/payments", payments);
app.route("/paywalls", paywalls);
app.route("/subscriptions", subscriptions);
app.route("/projects", projects);
app.route("/splits", splits);
app.route("/x402", x402);
app.route("/analytics", analytics);

// 404 handler
app.notFound((c) => {
  const reqId = getRequestId(c);
  logger.warn({ reqId, method: c.req.method, path: c.req.path }, "Route not found");

  return c.json(
    {
      error: "Not Found",
      message: `Route ${c.req.method} ${c.req.path} not found`,
      requestId: reqId,
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  const reqId = getRequestId(c);
  logger.error({ reqId, error: err }, "API Error");
  captureError(err, { reqId, path: c.req.path, method: c.req.method });

  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
      requestId: reqId,
    },
    500
  );
});

// Start server
const port = parseInt(process.env.API_PORT || "3000", 10);

logger.info(
  { port, chainId, network: networkName },
  "Starting Twinkle API"
);

const server = serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});

logger.info({ url: `http://0.0.0.0:${port}` }, "Twinkle API running");

// Log available endpoints (only in development)
if (process.env.NODE_ENV !== "production") {
  logger.info(`
Available endpoints:
  GET /                         - Health check & info
  GET /health                   - Health status
  GET /metrics                  - Prometheus metrics

  GET /payments                 - List direct payments
  GET /payments/:txHash         - Get payment by tx hash

  GET /paywalls                 - List paywalls
  GET /paywalls/:id             - Get paywall details
  GET /paywalls/:id/unlocks     - Get paywall unlocks
  GET /paywalls/:id/check/:addr - Check if user unlocked

  GET /subscriptions/plans      - List subscription plans
  GET /subscriptions/plans/:id  - Get plan details
  GET /subscriptions/:id        - Get subscription details
  GET /subscriptions/user/:addr - Get user's subscriptions
  GET /subscriptions/:id/renewals - Get subscription renewals

  GET /projects                 - List escrow projects
  GET /projects/:id             - Get project with milestones
  GET /projects/:id/milestones  - Get project milestones
  GET /projects/:id/dispute     - Get project dispute

  GET /splits                   - List splits
  GET /splits/:id               - Get split details
  GET /splits/:id/distributions - Get split distributions
  GET /splits/:id/withdrawals   - Get split withdrawals

  GET /x402/requests            - List payment requests
  GET /x402/requests/:id        - Get payment request
  GET /x402/settlements         - List settlements
  GET /x402/agent-payments      - List agent payments
  GET /x402/access-proofs/:id   - Verify access proof

  GET /analytics/overview       - Protocol overview stats
  GET /analytics/daily          - Daily stats
  GET /analytics/top-creators   - Top creators by revenue
  GET /analytics/protocol-events - Recent protocol events
`);
}

// Graceful shutdown handler
function gracefulShutdown(signal: string) {
  logger.info({ signal }, "Received shutdown signal, starting graceful shutdown...");

  // Close HTTP server (stop accepting new connections)
  server.close(async () => {
    logger.info("HTTP server closed");

    // Close Redis connection
    try {
      await redis.quit();
      logger.info("Redis connection closed");
    } catch (error) {
      logger.error({ error }, "Error closing Redis connection");
    }

    logger.info("Graceful shutdown complete");
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown doesn't complete
  setTimeout(() => {
    logger.warn("Graceful shutdown timeout, forcing exit");
    process.exit(1);
  }, 10_000);
}

// Register shutdown handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  captureError(error, { type: "uncaughtException" });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled rejection");
  if (reason instanceof Error) {
    captureError(reason, { type: "unhandledRejection" });
  }
  process.exit(1);
});
