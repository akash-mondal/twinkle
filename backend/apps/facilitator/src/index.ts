
/**
 * Twinkle x402 Facilitator Server
 * Handles EIP-712 verification and settlement for AI agent payments
 * Production-hardened with Redis, logging, rate limiting, and health checks
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

import {
  createVerificationService,
  createMNEESafetyService,
  createSettlementService,
  type PaymentPayload,
  type PaymentRequirements,
} from "./services/index.js";
import type { PaymentIntent } from "@twinkle/shared";
import { getContracts, getCurrentChainId, CHAIN_IDS, type SupportedChainId } from "@twinkle/shared/constants";
import {
  createRedisClient,
  createLogger,
  createFallbackPublicClient,
  getChainById,
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
const chain = getChainById(chainId);
const contracts = getContracts(chainId as SupportedChainId);
const networkName = chainId === 1 ? 'Mainnet' : 'Sepolia';
// Type assertion needed because contracts is a union type
const mneeAddress = chainId === 1
  ? (contracts as { MNEE: string }).MNEE
  : (contracts as { TestMNEE: string }).TestMNEE;
const mneeSymbol = chainId === 1 ? 'MNEE' : 'tMNEE';

// Initialize observability first
initTracing({ serviceName: "facilitator" });
initSentry({ serviceName: "facilitator" });

// Create logger
const logger = createLogger({ serviceName: "facilitator" });

// Initialize Redis
const redis = createRedisClient();

// Initialize public client for health checks
const publicClient = createFallbackPublicClient({ chain });

// Initialize services
const verificationService = createVerificationService();
const mneeSafetyService = createMNEESafetyService();
let settlementService: ReturnType<typeof createSettlementService> | null = null;

// Only initialize settlement service if private key is provided
if (process.env.FACILITATOR_PRIVATE_KEY) {
  settlementService = createSettlementService(redis);
  logger.info("Settlement service initialized with Redis-backed nonce manager");
} else {
  logger.warn("FACILITATOR_PRIVATE_KEY not set - settlement disabled");
}

// Request validation schemas
const PaymentPayloadSchema = z.object({
  x402Version: z.number(),
  scheme: z.literal("exact"),
  network: z.string(),
  payload: z.object({
    signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
    authorization: z.object({
      payer: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      requestId: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
      amount: z.string(),
      validUntil: z.string(),
      nonce: z.string(),
    }),
  }),
});

const PaymentRequirementsSchema = z.object({
  scheme: z.literal("exact"),
  network: z.string(),
  maxAmountRequired: z.string(),
  resource: z.string(),
  payTo: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  maxTimeoutSeconds: z.number(),
  asset: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

// Create Hono app
const app = new Hono();

// Middleware - order matters
app.use("*", requestIdMiddleware());
app.use("*", cors());

// Rate limiting - skip health and metrics endpoints
app.use("*", async (c, next) => {
  const path = c.req.path;
  if (path === "/health" || path === "/metrics" || path === "/") {
    await next();
    return;
  }
  return rateLimit(redis, {
    windowMs: 60_000, // 1 minute
    max: 100,
    keyGenerator: (ctx) => {
      const forwarded = ctx.req.header("x-forwarded-for");
      const ip = forwarded?.split(",")[0].trim() || ctx.req.header("x-real-ip") || "anonymous";
      return `facilitator:ratelimit:${ip}`;
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
app.get("/", (c) => {
  return c.json({
    service: "twinkle-x402-facilitator",
    version: "1.0.0",
    status: "healthy",
    chainId,
    network: networkName,
    settlementEnabled: !!settlementService,
  });
});

// Health check with dependency status
app.get("/health", async (c) => {
  const health = await checkHealth({ redis, publicClient });
  const statusCode = health.status === "healthy" ? 200 : 503;

  return c.json(
    {
      ...health,
      service: "facilitator",
      settlementEnabled: !!settlementService,
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

// GET /supported - Returns supported networks and configuration
app.get("/supported", (c) => {
  return c.json({
    networks: [
      {
        network: `eip155:${chainId}`,
        chainId,
        name: networkName,
        assets: [
          {
            address: mneeAddress,
            symbol: mneeSymbol,
            decimals: 18,
          },
        ],
      },
    ],
    facilitator: settlementService?.facilitatorAddress || null,
    contracts: {
      TwinkleX402: contracts.TwinkleX402,
      TwinklePay: contracts.TwinklePay,
    },
  });
});

// POST /verify - Verify payment payload
app.post("/verify", async (c) => {
  const reqId = getRequestId(c);

  try {
    const body = await c.req.json();

    const { paymentPayload, paymentRequirements } = body;

    // Validate request
    const payloadResult = PaymentPayloadSchema.safeParse(paymentPayload);
    if (!payloadResult.success) {
      logger.warn({ reqId, errors: payloadResult.error.errors }, "Invalid payment payload format");
      return c.json(
        { valid: false, invalidReason: "Invalid payment payload format" },
        400
      );
    }

    const requirementsResult =
      PaymentRequirementsSchema.safeParse(paymentRequirements);
    if (!requirementsResult.success) {
      logger.warn({ reqId, errors: requirementsResult.error.errors }, "Invalid payment requirements format");
      return c.json(
        { valid: false, invalidReason: "Invalid payment requirements format" },
        400
      );
    }

    const payload = payloadResult.data as PaymentPayload;
    const requirements = requirementsResult.data as PaymentRequirements;

    // Verify payment payload
    const verifyResult = await verificationService.verifyPaymentPayload(
      payload,
      requirements
    );

    if (!verifyResult.valid) {
      logger.info({ reqId, reason: verifyResult.reason }, "Payment verification failed");
      return c.json({
        valid: false,
        invalidReason: verifyResult.reason,
      });
    }

    // Check MNEE safety
    const safetyResult = await mneeSafetyService.checkPaymentSafety(
      payload.payload.authorization.payer as `0x${string}`,
      requirements.payTo as `0x${string}`,
      BigInt(payload.payload.authorization.amount)
    );

    if (!safetyResult.safe) {
      logger.info({ reqId, reason: safetyResult.reason }, "MNEE safety check failed");
      return c.json({
        valid: false,
        invalidReason: safetyResult.reason,
      });
    }

    logger.info(
      { reqId, payer: payload.payload.authorization.payer, amount: payload.payload.authorization.amount },
      "Payment verified successfully"
    );

    return c.json({
      valid: true,
      payer: payload.payload.authorization.payer,
      amount: payload.payload.authorization.amount,
    });
  } catch (error) {
    logger.error({ reqId, error }, "Verification error");
    captureError(error as Error, { reqId, endpoint: "/verify" });
    return c.json(
      {
        valid: false,
        invalidReason:
          error instanceof Error ? error.message : "Verification failed",
      },
      500
    );
  }
});

// POST /settle - Execute settlement on-chain
app.post("/settle", async (c) => {
  const reqId = getRequestId(c);

  if (!settlementService) {
    return c.json({ success: false, error: "Settlement not enabled" }, 503);
  }

  try {
    const body = await c.req.json();

    const { paymentPayload, paymentRequirements } = body;

    // Validate request
    const payloadResult = PaymentPayloadSchema.safeParse(paymentPayload);
    if (!payloadResult.success) {
      logger.warn({ reqId, errors: payloadResult.error.errors }, "Invalid payment payload");
      return c.json({ success: false, error: "Invalid payment payload" }, 400);
    }

    const requirementsResult =
      PaymentRequirementsSchema.safeParse(paymentRequirements);
    if (!requirementsResult.success) {
      logger.warn({ reqId, errors: requirementsResult.error.errors }, "Invalid payment requirements");
      return c.json(
        { success: false, error: "Invalid payment requirements" },
        400
      );
    }

    const payload = payloadResult.data as PaymentPayload;
    const requirements = requirementsResult.data as PaymentRequirements;

    // Verify first
    const verifyResult = await verificationService.verifyPaymentPayload(
      payload,
      requirements
    );

    if (!verifyResult.valid) {
      logger.info({ reqId, reason: verifyResult.reason }, "Verification failed before settlement");
      return c.json({ success: false, error: verifyResult.reason }, 400);
    }

    // Check MNEE safety
    const safetyResult = await mneeSafetyService.checkPaymentSafety(
      payload.payload.authorization.payer as `0x${string}`,
      requirements.payTo as `0x${string}`,
      BigInt(payload.payload.authorization.amount)
    );

    if (!safetyResult.safe) {
      logger.info({ reqId, reason: safetyResult.reason }, "MNEE safety check failed before settlement");
      return c.json({ success: false, error: safetyResult.reason }, 400);
    }

    // Construct PaymentIntent
    const intent: PaymentIntent = {
      payer: payload.payload.authorization.payer as `0x${string}`,
      requestId: payload.payload.authorization.requestId as `0x${string}`,
      amount: BigInt(payload.payload.authorization.amount),
      validUntil: BigInt(payload.payload.authorization.validUntil),
      nonce: BigInt(payload.payload.authorization.nonce),
    };

    logger.info(
      { reqId, requestId: intent.requestId, payer: intent.payer, amount: intent.amount.toString() },
      "Starting settlement"
    );

    // Execute settlement
    const result = await settlementService.settle(
      payload.payload.authorization.requestId as `0x${string}`,
      intent,
      payload.payload.signature as `0x${string}`
    );

    if (!result.success) {
      logger.error({ reqId, error: result.error, attempts: result.attempts }, "Settlement failed");
      return c.json({ success: false, error: result.error }, 500);
    }

    logger.info(
      { reqId, txHash: result.transactionHash, accessProofId: result.accessProofId },
      "Settlement successful"
    );

    return c.json({
      success: true,
      transactionHash: result.transactionHash,
      accessProofId: result.accessProofId,
      gasUsed: result.gasUsed?.toString(),
    });
  } catch (error) {
    logger.error({ reqId, error }, "Settlement error");
    captureError(error as Error, { reqId, endpoint: "/settle" });
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Settlement failed",
      },
      500
    );
  }
});

// POST /settle-ap2 - Settle with agent payment info
app.post("/settle-ap2", async (c) => {
  const reqId = getRequestId(c);

  if (!settlementService) {
    return c.json({ success: false, error: "Settlement not enabled" }, 503);
  }

  try {
    const body = await c.req.json();

    const { paymentPayload, paymentRequirements, agentInfo } = body;

    // Validate agent info
    if (!agentInfo?.agentId || !agentInfo?.agentType) {
      logger.warn({ reqId }, "Missing agent info in AP2 settlement");
      return c.json({ success: false, error: "Missing agent info" }, 400);
    }

    const payload = PaymentPayloadSchema.parse(paymentPayload) as PaymentPayload;
    const requirements = PaymentRequirementsSchema.parse(
      paymentRequirements
    ) as PaymentRequirements;

    // Verify and check safety (same as /settle)
    const verifyResult = await verificationService.verifyPaymentPayload(
      payload,
      requirements
    );

    if (!verifyResult.valid) {
      logger.info({ reqId, reason: verifyResult.reason }, "Verification failed in AP2 settlement");
      return c.json({ success: false, error: verifyResult.reason }, 400);
    }

    const safetyResult = await mneeSafetyService.checkPaymentSafety(
      payload.payload.authorization.payer as `0x${string}`,
      requirements.payTo as `0x${string}`,
      BigInt(payload.payload.authorization.amount)
    );

    if (!safetyResult.safe) {
      logger.info({ reqId, reason: safetyResult.reason }, "MNEE safety check failed in AP2 settlement");
      return c.json({ success: false, error: safetyResult.reason }, 400);
    }

    const intent: PaymentIntent = {
      payer: payload.payload.authorization.payer as `0x${string}`,
      requestId: payload.payload.authorization.requestId as `0x${string}`,
      amount: BigInt(payload.payload.authorization.amount),
      validUntil: BigInt(payload.payload.authorization.validUntil),
      nonce: BigInt(payload.payload.authorization.nonce),
    };

    logger.info(
      { reqId, requestId: intent.requestId, agentId: agentInfo.agentId, agentType: agentInfo.agentType },
      "Starting AP2 settlement"
    );

    const result = await settlementService.settleWithAP2(
      payload.payload.authorization.requestId as `0x${string}`,
      intent,
      payload.payload.signature as `0x${string}`,
      {
        agentId: agentInfo.agentId as `0x${string}`,
        agentType: agentInfo.agentType,
        sessionId: (agentInfo.sessionId ||
          "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`,
        metadata: (agentInfo.metadata || "0x") as `0x${string}`,
      }
    );

    if (!result.success) {
      logger.error({ reqId, error: result.error }, "AP2 settlement failed");
      return c.json({ success: false, error: result.error }, 500);
    }

    logger.info(
      { reqId, txHash: result.transactionHash },
      "AP2 settlement successful"
    );

    return c.json({
      success: true,
      transactionHash: result.transactionHash,
      accessProofId: result.accessProofId,
      gasUsed: result.gasUsed?.toString(),
    });
  } catch (error) {
    logger.error({ reqId, error }, "AP2 Settlement error");
    captureError(error as Error, { reqId, endpoint: "/settle-ap2" });
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Settlement failed",
      },
      500
    );
  }
});

// GET /request/:id - Get payment request details
app.get("/request/:id", async (c) => {
  const reqId = getRequestId(c);

  if (!settlementService) {
    return c.json({ error: "Settlement not enabled" }, 503);
  }

  try {
    const requestId = c.req.param("id") as `0x${string}`;

    const request = await settlementService.getPaymentRequest(requestId) as readonly [
      `0x${string}`, // payTo
      bigint, // amount
      `0x${string}`, // paywallId
      bigint, // validUntil
      boolean, // settled
    ];
    const isValid = await settlementService.isRequestValid(requestId);

    return c.json({
      payTo: request[0],
      amount: request[1].toString(),
      paywallId: request[2],
      validUntil: request[3].toString(),
      settled: request[4],
      isValid,
    });
  } catch (error) {
    logger.error({ reqId, error }, "Error fetching payment request");
    return c.json(
      { error: error instanceof Error ? error.message : "Request not found" },
      404
    );
  }
});

// Start server
const port = parseInt(process.env.FACILITATOR_PORT || "3001", 10);

logger.info(
  { port, chainId, network: networkName, x402: contracts.TwinkleX402 },
  "Starting x402 Facilitator"
);

const server = serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});

logger.info({ url: `http://0.0.0.0:${port}` }, "x402 Facilitator running");

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
