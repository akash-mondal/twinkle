/**
 * x402 API Module
 * Payment requests and settlements
 */

import { Hono } from "hono";
import { sql } from "../db.js";

const app = new Hono();

// GET /x402/requests - List payment requests
app.get("/requests", async (c) => {
  try {
    const payTo = c.req.query("payTo");
    const creator = c.req.query("creator");
    const settled = c.req.query("settled");
    const limit = Number(c.req.query("limit") || 20);
    const offset = Number(c.req.query("offset") || 0);

    const conditions: string[] = [];

    if (payTo) {
      conditions.push(`pay_to = '${payTo.toLowerCase()}'`);
    }

    if (creator) {
      conditions.push(`creator = '${creator.toLowerCase()}'`);
    }

    if (settled !== undefined) {
      conditions.push(`settled = ${settled === "true"}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const requests = await sql.unsafe(`
      SELECT
        id,
        pay_to as "payTo",
        amount::text,
        paywall_id as "paywallId",
        valid_until::text as "validUntil",
        creator,
        settled,
        cancelled,
        created_at::text as "createdAt"
      FROM payment_requests
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return c.json({ data: requests });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /x402/requests/:id - Get payment request
app.get("/requests/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const requests = await sql`
      SELECT
        id,
        pay_to as "payTo",
        amount::text,
        paywall_id as "paywallId",
        valid_until::text as "validUntil",
        creator,
        settled,
        cancelled,
        created_at::text as "createdAt",
        created_tx_hash as "createdTxHash"
      FROM payment_requests
      WHERE id = ${id}
    `;

    if (requests.length === 0) {
      return c.json({ error: "Request not found" }, 404);
    }

    return c.json({ data: requests[0] });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /x402/settlements - List settlements
app.get("/settlements", async (c) => {
  try {
    const from = c.req.query("from");
    const payTo = c.req.query("payTo");
    const limit = Number(c.req.query("limit") || 20);
    const offset = Number(c.req.query("offset") || 0);

    const conditions: string[] = [];

    if (from) {
      conditions.push(`"from" = '${from.toLowerCase()}'`);
    }

    if (payTo) {
      conditions.push(`pay_to = '${payTo.toLowerCase()}'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const settlements = await sql.unsafe(`
      SELECT
        id,
        request_id as "requestId",
        "from",
        pay_to as "payTo",
        amount::text,
        platform_fee::text as "platformFee",
        access_proof_id as "accessProofId",
        timestamp::text,
        tx_hash as "txHash",
        block_number::text as "blockNumber"
      FROM x402_settlements
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return c.json({ data: settlements });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /x402/agent-payments - List agent payments
app.get("/agent-payments", async (c) => {
  try {
    const agentId = c.req.query("agentId");
    const agentType = c.req.query("agentType");
    const limit = Number(c.req.query("limit") || 20);
    const offset = Number(c.req.query("offset") || 0);

    const conditions: string[] = [];

    if (agentId) {
      conditions.push(`agent_id = '${agentId}'`);
    }

    if (agentType) {
      conditions.push(`agent_type = '${agentType}'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const payments = await sql.unsafe(`
      SELECT
        id,
        request_id as "requestId",
        agent_id as "agentId",
        agent_type as "agentType",
        session_id as "sessionId",
        amount::text,
        timestamp::text,
        tx_hash as "txHash"
      FROM agent_payments
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return c.json({ data: payments });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /x402/access-proofs/:id - Verify access proof
app.get("/access-proofs/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const proofs = await sql`
      SELECT
        id,
        request_id as "requestId",
        payer,
        recipient,
        amount::text,
        paywall_id as "paywallId",
        created_at::text as "createdAt",
        block_number::text as "blockNumber",
        revoked
      FROM access_proofs
      WHERE id = ${id}
    `;

    if (proofs.length === 0) {
      return c.json({ valid: false, error: "Access proof not found" }, 404);
    }

    const proof = proofs[0];

    return c.json({
      valid: !proof.revoked,
      proof,
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

export default app;
