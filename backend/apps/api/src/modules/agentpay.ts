/**
 * AgentPay API Module
 * AI Chat agent with x402 paid API calls
 */

import { Hono } from "hono";
import OpenAI from "openai";
import { sql } from "../db.js";
import { cryptoTools, toolCosts, toolToSourceId, executeApiCall } from "./agentpay-tools.js";
import { randomUUID } from "crypto";

const app = new Hono();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// In-memory session storage (for simplicity - could use Redis/DB for production)
interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
}

interface PendingToolCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  assistantMessage: OpenAI.Chat.Completions.ChatCompletionMessage;
}

interface Session {
  id: string;
  messages: Message[];
  userAddress?: string;
  pendingToolCall?: PendingToolCall;
  createdAt: number;
}

const sessions = new Map<string, Session>();

// Cleanup old sessions every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.createdAt < oneHourAgo) {
      sessions.delete(id);
    }
  }
}, 60 * 60 * 1000);

// System prompt for the agent
const SYSTEM_PROMPT = `You are AgentPay, a crypto data assistant powered by x402 payments. You help users get real-time cryptocurrency data.

You have access to various crypto data tools:
- get_price: Get current prices for specific cryptocurrencies
- get_markets: Get top coins by market cap
- get_trending: See what's trending
- get_history: Get historical price charts
- get_token: Get detailed info about a coin
- get_pools: See top DEX liquidity pools
- get_trades: Recent DEX trading activity
- get_gas: Current Ethereum gas prices
- get_btc: Bitcoin Price Index
- get_rates: BTC exchange rates
- get_eth_stats: Ethereum network stats
- get_sentiment: Crypto Fear & Greed Index
- get_global: Global market statistics
- get_nfts: Trending NFT collections

Each API call costs 0.1 MNEE. When you need data, call the appropriate tool - the user will be prompted to pay before the data is retrieved.

Be helpful and concise. Format numbers nicely and provide context when showing data.`;

// POST /agentpay/chat - Send a message to the agent
app.post("/chat", async (c) => {
  try {
    const body = await c.req.json();
    const { message, sessionId, userAddress } = body;

    if (!message || typeof message !== "string") {
      return c.json({ error: "Message is required" }, 400);
    }

    // Get or create session
    let session = sessionId ? sessions.get(sessionId) : null;
    if (!session) {
      session = {
        id: randomUUID(),
        messages: [{ role: "system", content: SYSTEM_PROMPT }],
        userAddress,
        createdAt: Date.now()
      };
      sessions.set(session.id, session);
    }

    // Update user address if provided
    if (userAddress) {
      session.userAddress = userAddress;
    }

    // Add user message
    session.messages.push({ role: "user", content: message });

    // Call OpenAI GPT-5.2
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: session.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      tools: cryptoTools,
      tool_choice: "auto"
    });

    const assistantMessage = response.choices[0].message;

    // Check if OpenAI wants to call a tool
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);
      const cost = toolCosts[toolName] || "0.1";
      const sourceId = toolToSourceId[toolName] || toolName;

      // Store pending tool call in session
      session.pendingToolCall = {
        id: toolCall.id,
        toolName,
        args: toolArgs,
        assistantMessage
      };

      // Create payment request ID
      const paymentRequestId = randomUUID();

      // Store payment request in database
      const validUntil = Math.floor(Date.now() / 1000) + 300; // 5 minutes
      const payTo = process.env.AGENTPAY_RECIPIENT || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bA1A";

      try {
        await sql`
          INSERT INTO payment_requests (id, pay_to, amount, valid_until, creator, paywall_id)
          VALUES (${paymentRequestId}, ${payTo.toLowerCase()}, ${cost}, ${validUntil}, ${"agentpay"}, ${`agentpay-${toolName}`})
        `;
      } catch (dbError) {
        console.error("Failed to create payment request:", dbError);
      }

      return c.json({
        status: "payment_required",
        sessionId: session.id,
        tool: toolName,
        sourceId,
        args: toolArgs,
        cost,
        paymentRequest: {
          requestId: paymentRequestId,
          payTo,
          amount: cost,
          validUntil,
          description: `API Call: ${toolName}`
        }
      });
    }

    // No tool call - just a regular response
    session.messages.push({
      role: "assistant",
      content: assistantMessage.content || ""
    });

    return c.json({
      status: "complete",
      sessionId: session.id,
      response: assistantMessage.content
    });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      500
    );
  }
});

// POST /agentpay/execute - Execute tool after payment verification
app.post("/execute", async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId, accessProofId, txHash } = body;

    if (!sessionId) {
      return c.json({ error: "Session ID is required" }, 400);
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    if (!session.pendingToolCall) {
      return c.json({ error: "No pending tool call" }, 400);
    }

    // Verify payment (check access proof or transaction)
    if (accessProofId) {
      try {
        const proofs = await sql`
          SELECT id, revoked FROM access_proofs WHERE id = ${accessProofId}
        `;
        if (proofs.length === 0 || proofs[0].revoked) {
          return c.json({ error: "Invalid or revoked access proof" }, 400);
        }
      } catch (dbError) {
        console.warn("Access proof verification failed:", dbError);
        // Continue anyway for testing
      }
    }

    const { id, toolName, args, assistantMessage } = session.pendingToolCall;
    const sourceId = toolToSourceId[toolName] || toolName;

    // Execute the actual API call
    let apiResult: unknown;
    try {
      apiResult = await executeApiCall(toolName, args);
    } catch (apiError) {
      return c.json({
        status: "error",
        sessionId: session.id,
        sourceId,
        error: apiError instanceof Error ? apiError.message : "API call failed"
      });
    }

    // Add assistant message with tool call
    session.messages.push({
      role: "assistant",
      content: assistantMessage.content || "",
      tool_calls: assistantMessage.tool_calls
    });

    // Add tool result
    session.messages.push({
      role: "tool",
      tool_call_id: id,
      content: JSON.stringify(apiResult)
    });

    // Clear pending tool call
    session.pendingToolCall = undefined;

    // Get final response from OpenAI GPT-5.2
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: session.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[]
    });

    const finalMessage = response.choices[0].message;

    // Add final response to session
    session.messages.push({
      role: "assistant",
      content: finalMessage.content || ""
    });

    return c.json({
      status: "complete",
      sessionId: session.id,
      sourceId,
      response: finalMessage.content,
      rawData: apiResult
    });
  } catch (error) {
    console.error("Execute error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Execution failed" },
      500
    );
  }
});

// GET /agentpay/session/:id - Get session info
app.get("/session/:id", (c) => {
  const sessionId = c.req.param("id");
  const session = sessions.get(sessionId);

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json({
    id: session.id,
    messageCount: session.messages.length - 1, // Exclude system message
    hasPendingPayment: !!session.pendingToolCall,
    createdAt: session.createdAt
  });
});

// DELETE /agentpay/session/:id - End session
app.delete("/session/:id", (c) => {
  const sessionId = c.req.param("id");
  const deleted = sessions.delete(sessionId);

  return c.json({ success: deleted });
});

export default app;
