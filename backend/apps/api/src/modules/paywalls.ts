/**
 * Paywalls API Module
 */

import { Hono } from "hono";
import { z } from "zod";
import { sql } from "../db.js";

const app = new Hono();

const paywallsQuerySchema = z.object({
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  active: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// GET /paywalls - List paywalls
app.get("/", async (c) => {
  try {
    const query = paywallsQuerySchema.parse(c.req.query());

    const conditions: string[] = [];

    if (query.creator) {
      conditions.push(`creator = '${query.creator.toLowerCase()}'`);
    }

    if (query.active !== undefined) {
      conditions.push(`active = ${query.active === "true"}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const paywalls = await sql.unsafe(`
      SELECT
        id,
        creator,
        price::text,
        split_address as "splitAddress",
        total_unlocks as "totalUnlocks",
        total_revenue::text as "totalRevenue",
        active,
        x402_enabled as "x402Enabled",
        refundable,
        created_at::text as "createdAt",
        created_tx_hash as "createdTxHash"
      FROM paywalls
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${query.limit}
      OFFSET ${query.offset}
    `);

    const countResult = await sql.unsafe(`
      SELECT COUNT(*) as total FROM paywalls ${whereClause}
    `);

    const total = Number(countResult[0]?.total || 0);

    return c.json({
      data: paywalls,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total,
        hasMore: query.offset + paywalls.length < total,
      },
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /paywalls/:id - Get paywall by ID
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const paywalls = await sql`
      SELECT
        id,
        creator,
        price::text,
        split_address as "splitAddress",
        total_unlocks as "totalUnlocks",
        total_revenue::text as "totalRevenue",
        active,
        x402_enabled as "x402Enabled",
        refundable,
        created_at::text as "createdAt",
        created_tx_hash as "createdTxHash"
      FROM paywalls
      WHERE id = ${id}
    `;

    if (paywalls.length === 0) {
      return c.json({ error: "Paywall not found" }, 404);
    }

    return c.json({ data: paywalls[0] });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /paywalls/:id/unlocks - Get paywall unlocks
app.get("/:id/unlocks", async (c) => {
  try {
    const id = c.req.param("id");
    const limit = Number(c.req.query("limit") || 20);
    const offset = Number(c.req.query("offset") || 0);

    const unlocks = await sql`
      SELECT
        id,
        paywall_id as "paywallId",
        "user",
        amount::text,
        platform_fee::text as "platformFee",
        unlocked_at::text as "unlockedAt",
        tx_hash as "txHash"
      FROM paywall_unlocks
      WHERE paywall_id = ${id}
      ORDER BY unlocked_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return c.json({ data: unlocks });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /paywalls/:id/check/:address - Check if user has unlocked
app.get("/:id/check/:address", async (c) => {
  try {
    const id = c.req.param("id");
    const address = c.req.param("address");

    const unlocks = await sql`
      SELECT id FROM paywall_unlocks
      WHERE paywall_id = ${id} AND "user" = ${address.toLowerCase()}
      LIMIT 1
    `;

    return c.json({
      paywallId: id,
      address,
      unlocked: unlocks.length > 0,
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

export default app;
