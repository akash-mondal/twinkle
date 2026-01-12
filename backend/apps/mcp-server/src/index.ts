#!/usr/bin/env node
/**
 * Twinkle MCP Server
 * Model Context Protocol server for AI agent payments
 * Production-hardened with RPC fallback and structured logging
 *
 * Provides tools for:
 * - Checking MNEE balances
 * - Getting paywall information
 * - Creating payment intents
 * - Checking subscription status
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  // Payment tools
  checkBalance,
  checkBalanceSchema,
  getPaywall,
  getPaywallSchema,
  checkUnlock,
  checkUnlockSchema,
  createPaymentIntent,
  createPaymentIntentSchema,
  getPaymentRequest,
  getPaymentRequestSchema,
  // Subscription tools
  getPlan,
  getPlanSchema,
  hasValidSubscription,
  checkSubscriptionSchema,
  getSubscription,
  getSubscriptionSchema,
} from "./tools/index.js";

import { getContracts, getCurrentChainId, type SupportedChainId } from "@twinkle/shared/constants";
import { createLogger, initSentry, captureError } from "@twinkle/shared";

// Get chain configuration
const chainId = getCurrentChainId();
const contracts = getContracts(chainId as SupportedChainId);
const networkName = chainId === 1 ? 'mainnet' : 'sepolia';
// Type assertion needed because contracts is a union type
const mneeAddress = chainId === 1
  ? (contracts as { MNEE: string }).MNEE
  : (contracts as { TestMNEE: string }).TestMNEE;
const mneeSymbol = chainId === 1 ? 'MNEE' : 'tMNEE';

// Initialize Sentry for error tracking
initSentry({ serviceName: "mcp-server" });

// Create logger (logs to stderr to avoid interfering with MCP stdio)
const logger = createLogger({
  serviceName: "mcp-server",
  level: process.env.LOG_LEVEL || "warn", // Quiet by default for MCP
});

// Create MCP server
const server = new McpServer({
  name: "twinkle-payments",
  version: "1.0.0",
});

// =============================================================================
// Payment Tools
// =============================================================================

server.tool(
  "twinkle_check_balance",
  "Check MNEE token balance for an Ethereum address",
  checkBalanceSchema.shape,
  async ({ address }) => {
    try {
      logger.debug({ address }, "Tool: check_balance");
      const result = await checkBalance(address);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                address,
                balance: result.balance,
                symbol: result.symbol,
                raw: result.raw,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logger.error({ address, error }, "Tool error: check_balance");
      captureError(error as Error, { tool: "check_balance", address });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "twinkle_get_paywall",
  "Get details of a Twinkle paywall including price and unlock status",
  getPaywallSchema.shape,
  async ({ paywallId }) => {
    try {
      logger.debug({ paywallId }, "Tool: get_paywall");
      const result = await getPaywall(paywallId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                paywallId,
                ...result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logger.error({ paywallId, error }, "Tool error: get_paywall");
      captureError(error as Error, { tool: "get_paywall", paywallId });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "twinkle_check_unlock",
  "Check if a user has unlocked a specific paywall",
  checkUnlockSchema.shape,
  async ({ paywallId, userAddress }) => {
    try {
      logger.debug({ paywallId, userAddress }, "Tool: check_unlock");
      const result = await checkUnlock(paywallId, userAddress);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                paywallId,
                userAddress,
                ...result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logger.error({ paywallId, userAddress, error }, "Tool error: check_unlock");
      captureError(error as Error, { tool: "check_unlock", paywallId, userAddress });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "twinkle_create_payment_intent",
  "Create a payment intent for the user to sign. Returns EIP-712 typed data.",
  createPaymentIntentSchema.shape,
  async ({ payerAddress, recipientAddress, amount, paywallId }) => {
    try {
      logger.debug({ payerAddress, recipientAddress, amount, paywallId }, "Tool: create_payment_intent");
      const result = await createPaymentIntent(
        payerAddress,
        recipientAddress,
        amount,
        paywallId
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                action: "sign_payment_intent",
                ...result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logger.error({ payerAddress, recipientAddress, amount, error }, "Tool error: create_payment_intent");
      captureError(error as Error, { tool: "create_payment_intent", payerAddress, recipientAddress, amount });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "twinkle_get_payment_request",
  "Get details of an x402 payment request",
  getPaymentRequestSchema.shape,
  async ({ requestId }) => {
    try {
      logger.debug({ requestId }, "Tool: get_payment_request");
      const result = await getPaymentRequest(requestId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                requestId,
                ...result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logger.error({ requestId, error }, "Tool error: get_payment_request");
      captureError(error as Error, { tool: "get_payment_request", requestId });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Subscription Tools
// =============================================================================

server.tool(
  "twinkle_get_plan",
  "Get details of a subscription plan",
  getPlanSchema.shape,
  async ({ planId }) => {
    try {
      logger.debug({ planId }, "Tool: get_plan");
      const result = await getPlan(planId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                planId,
                ...result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logger.error({ planId, error }, "Tool error: get_plan");
      captureError(error as Error, { tool: "get_plan", planId });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "twinkle_check_subscription",
  "Check if a user has an active subscription to a plan",
  checkSubscriptionSchema.shape,
  async ({ planId, userAddress }) => {
    try {
      logger.debug({ planId, userAddress }, "Tool: check_subscription");
      const result = await hasValidSubscription(planId, userAddress);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                planId,
                userAddress,
                ...result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logger.error({ planId, userAddress, error }, "Tool error: check_subscription");
      captureError(error as Error, { tool: "check_subscription", planId, userAddress });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "twinkle_get_subscription",
  "Get details of a specific subscription",
  getSubscriptionSchema.shape,
  async ({ subId }) => {
    try {
      logger.debug({ subId }, "Tool: get_subscription");
      const result = await getSubscription(subId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                subscriptionId: subId,
                ...result,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      logger.error({ subId, error }, "Tool error: get_subscription");
      captureError(error as Error, { tool: "get_subscription", subId });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Resources
// =============================================================================

server.resource(
  "twinkle://config",
  "Twinkle configuration and contract addresses",
  {
    mimeType: "application/json",
  },
  async () => {
    return {
      contents: [
        {
          uri: "twinkle://config",
          mimeType: "application/json",
          text: JSON.stringify(
            {
              chainId,
              network: networkName,
              contracts,
              token: {
                address: mneeAddress,
                symbol: mneeSymbol,
                decimals: 18,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// =============================================================================
// Start Server
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (MCP uses stdout for communication)
  logger.info(
    { chainId, network: networkName, mneeToken: mneeAddress },
    "Twinkle MCP Server started"
  );
}

main().catch((error) => {
  logger.fatal({ error }, "Failed to start MCP server");
  captureError(error, { context: "startup" });
  process.exit(1);
});

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
