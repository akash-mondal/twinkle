/**
 * Splits API Module
 */

import { Hono } from "hono";
import { sql } from "../db.js";

const app = new Hono();

// GET /splits - List splits
app.get("/", async (c) => {
  try {
    const creator = c.req.query("creator");
    const active = c.req.query("active");
    const limit = Number(c.req.query("limit") || 20);
    const offset = Number(c.req.query("offset") || 0);

    const conditions: string[] = [];

    if (creator) {
      conditions.push(`creator = '${creator.toLowerCase()}'`);
    }

    if (active !== undefined) {
      conditions.push(`active = ${active === "true"}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const splits = await sql.unsafe(`
      SELECT
        id,
        creator,
        mutable,
        active,
        recipients_hash as "recipientsHash",
        total_distributed::text as "totalDistributed",
        balance::text,
        created_at::text as "createdAt"
      FROM splits
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return c.json({ data: splits });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /splits/:id - Get split details
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const splits = await sql`
      SELECT
        id,
        creator,
        mutable,
        active,
        recipients_hash as "recipientsHash",
        total_distributed::text as "totalDistributed",
        balance::text,
        created_at::text as "createdAt",
        created_tx_hash as "createdTxHash"
      FROM splits
      WHERE id = ${id}
    `;

    if (splits.length === 0) {
      return c.json({ error: "Split not found" }, 404);
    }

    return c.json({ data: splits[0] });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /splits/:id/distributions - Get split distributions
app.get("/:id/distributions", async (c) => {
  try {
    const id = c.req.param("id");
    const limit = Number(c.req.query("limit") || 20);
    const offset = Number(c.req.query("offset") || 0);

    const distributions = await sql`
      SELECT
        id,
        split_id as "splitId",
        amount::text,
        recipient_count as "recipientCount",
        platform_fee::text as "platformFee",
        timestamp::text,
        tx_hash as "txHash"
      FROM split_distributions
      WHERE split_id = ${id}
      ORDER BY timestamp DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return c.json({ data: distributions });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /splits/:id/withdrawals - Get split withdrawals
app.get("/:id/withdrawals", async (c) => {
  try {
    const id = c.req.param("id");
    const limit = Number(c.req.query("limit") || 20);
    const offset = Number(c.req.query("offset") || 0);

    const withdrawals = await sql`
      SELECT
        id,
        split_id as "splitId",
        recipient,
        amount::text,
        timestamp::text,
        tx_hash as "txHash"
      FROM split_withdrawals
      WHERE split_id = ${id}
      ORDER BY timestamp DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return c.json({ data: withdrawals });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

export default app;
