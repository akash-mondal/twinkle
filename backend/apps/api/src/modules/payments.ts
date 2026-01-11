/**
 * Payments API Module
 * Endpoints for payment history and direct payments
 */

import { Hono } from "hono";
import { z } from "zod";
import { sql } from "../db.js";

const app = new Hono();

// Query parameters schema
const paymentsQuerySchema = z.object({
  from: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// GET /payments - List payments
app.get("/", async (c) => {
  try {
    const query = paymentsQuerySchema.parse(c.req.query());

    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (query.from) {
      conditions.push(`"from" = $${paramIndex++}`);
      values.push(query.from.toLowerCase());
    }

    if (query.to) {
      conditions.push(`"to" = $${paramIndex++}`);
      values.push(query.to.toLowerCase());
    }

    if (query.startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      values.push(BigInt(new Date(query.startDate).getTime() / 1000));
    }

    if (query.endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      values.push(BigInt(new Date(query.endDate).getTime() / 1000));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Query direct payments
    const payments = await sql.unsafe(`
      SELECT
        id,
        "from",
        "to",
        amount::text,
        platform_fee::text as "platformFee",
        timestamp::text,
        tx_hash as "txHash",
        block_number::text as "blockNumber"
      FROM direct_payments
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${query.limit}
      OFFSET ${query.offset}
    `, values);

    // Get total count
    const countResult = await sql.unsafe(`
      SELECT COUNT(*) as total
      FROM direct_payments
      ${whereClause}
    `, values);

    const total = Number(countResult[0]?.total || 0);

    return c.json({
      data: payments,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total,
        hasMore: query.offset + payments.length < total,
      },
    });
  } catch (error) {
    console.error("Payments query error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /payments/:txHash - Get payment by transaction hash
app.get("/:txHash", async (c) => {
  try {
    const txHash = c.req.param("txHash");

    const payments = await sql`
      SELECT
        id,
        "from",
        "to",
        amount::text,
        platform_fee::text as "platformFee",
        timestamp::text,
        tx_hash as "txHash",
        block_number::text as "blockNumber"
      FROM direct_payments
      WHERE tx_hash = ${txHash.toLowerCase()}
    `;

    if (payments.length === 0) {
      return c.json({ error: "Payment not found" }, 404);
    }

    return c.json({ data: payments[0] });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

export default app;
