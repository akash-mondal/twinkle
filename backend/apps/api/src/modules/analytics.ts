/**
 * Analytics API Module
 */

import { Hono } from "hono";
import { sql } from "../db.js";

const app = new Hono();

// GET /analytics/overview - Get protocol overview
app.get("/overview", async (c) => {
  try {
    // Get total volumes
    const [
      directPayments,
      paywallUnlocks,
      x402Settlements,
      subscriptionRenewals,
      escrowFundings,
    ] = await Promise.all([
      sql`SELECT COALESCE(SUM(amount), 0)::text as total, COUNT(*) as count FROM direct_payments`,
      sql`SELECT COALESCE(SUM(amount), 0)::text as total, COUNT(*) as count FROM paywall_unlocks`,
      sql`SELECT COALESCE(SUM(amount), 0)::text as total, COUNT(*) as count FROM x402_settlements`,
      sql`SELECT COALESCE(SUM(amount), 0)::text as total, COUNT(*) as count FROM subscription_renewals`,
      sql`SELECT COALESCE(SUM(funded_amount), 0)::text as total, COUNT(*) as count FROM projects WHERE funded_amount > 0`,
    ]);

    // Get fee collections
    const fees = await sql`
      SELECT COALESCE(SUM(fee), 0)::text as total
      FROM fee_collections
    `;

    // Get entity counts
    const [paywalls, plans, projects, splits] = await Promise.all([
      sql`SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE active = true) as active FROM paywalls`,
      sql`SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE active = true) as active FROM subscription_plans`,
      sql`SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE status = 1) as active FROM projects`,
      sql`SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE active = true) as active FROM splits`,
    ]);

    return c.json({
      volume: {
        directPayments: {
          total: directPayments[0]?.total || "0",
          count: Number(directPayments[0]?.count || 0),
        },
        paywallUnlocks: {
          total: paywallUnlocks[0]?.total || "0",
          count: Number(paywallUnlocks[0]?.count || 0),
        },
        x402Settlements: {
          total: x402Settlements[0]?.total || "0",
          count: Number(x402Settlements[0]?.count || 0),
        },
        subscriptionRenewals: {
          total: subscriptionRenewals[0]?.total || "0",
          count: Number(subscriptionRenewals[0]?.count || 0),
        },
        escrowFundings: {
          total: escrowFundings[0]?.total || "0",
          count: Number(escrowFundings[0]?.count || 0),
        },
      },
      fees: {
        total: fees[0]?.total || "0",
      },
      entities: {
        paywalls: {
          total: Number(paywalls[0]?.count || 0),
          active: Number(paywalls[0]?.active || 0),
        },
        subscriptionPlans: {
          total: Number(plans[0]?.count || 0),
          active: Number(plans[0]?.active || 0),
        },
        projects: {
          total: Number(projects[0]?.count || 0),
          active: Number(projects[0]?.active || 0),
        },
        splits: {
          total: Number(splits[0]?.count || 0),
          active: Number(splits[0]?.active || 0),
        },
      },
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /analytics/daily - Get daily stats
app.get("/daily", async (c) => {
  try {
    const days = Number(c.req.query("days") || 30);

    const stats = await sql`
      SELECT
        date,
        total_payments as "totalPayments",
        total_volume::text as "totalVolume",
        total_fees::text as "totalFees",
        unique_payers as "uniquePayers",
        unique_recipients as "uniqueRecipients",
        paywall_unlocks as "paywallUnlocks",
        subscription_renewals as "subscriptionRenewals",
        escrow_fundings as "escrowFundings",
        x402_settlements as "x402Settlements"
      FROM daily_stats
      ORDER BY date DESC
      LIMIT ${days}
    `;

    return c.json({ data: stats });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /analytics/top-creators - Get top creators by revenue
app.get("/top-creators", async (c) => {
  try {
    const limit = Number(c.req.query("limit") || 10);

    const creators = await sql.unsafe(`
      SELECT
        creator,
        SUM(total_revenue)::text as "totalRevenue",
        SUM(total_unlocks) as "totalUnlocks"
      FROM paywalls
      GROUP BY creator
      ORDER BY SUM(total_revenue) DESC
      LIMIT ${limit}
    `);

    return c.json({ data: creators });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /analytics/protocol-events - Get recent protocol events
app.get("/protocol-events", async (c) => {
  try {
    const limit = Number(c.req.query("limit") || 50);

    const events = await sql`
      SELECT
        id,
        event_type as "eventType",
        triggered_by as "triggeredBy",
        timestamp::text,
        tx_hash as "txHash",
        data
      FROM protocol_events
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return c.json({ data: events });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

export default app;
