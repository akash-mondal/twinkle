/**
 * Subscriptions API Module
 */

import { Hono } from "hono";
import { z } from "zod";
import { sql } from "../db.js";

const app = new Hono();

// GET /subscriptions/plans - List subscription plans
app.get("/plans", async (c) => {
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

    const plans = await sql.unsafe(`
      SELECT
        id,
        creator,
        price::text,
        interval_days as "intervalDays",
        trial_days as "trialDays",
        split_address as "splitAddress",
        active,
        subscriber_count as "subscriberCount",
        total_revenue::text as "totalRevenue",
        created_at::text as "createdAt"
      FROM subscription_plans
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return c.json({ data: plans });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /subscriptions/plans/:id - Get plan details
app.get("/plans/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const plans = await sql`
      SELECT
        id,
        creator,
        price::text,
        interval_days as "intervalDays",
        trial_days as "trialDays",
        split_address as "splitAddress",
        active,
        subscriber_count as "subscriberCount",
        total_revenue::text as "totalRevenue",
        created_at::text as "createdAt"
      FROM subscription_plans
      WHERE id = ${id}
    `;

    if (plans.length === 0) {
      return c.json({ error: "Plan not found" }, 404);
    }

    return c.json({ data: plans[0] });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /subscriptions/:id - Get subscription details
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const subscriptions = await sql`
      SELECT
        id,
        plan_id as "planId",
        subscriber,
        started_at::text as "startedAt",
        current_period_end::text as "currentPeriodEnd",
        active,
        cancelled,
        is_trial as "isTrial",
        total_paid::text as "totalPaid",
        renewal_count as "renewalCount"
      FROM subscriptions
      WHERE id = ${id}
    `;

    if (subscriptions.length === 0) {
      return c.json({ error: "Subscription not found" }, 404);
    }

    return c.json({ data: subscriptions[0] });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /subscriptions/user/:address - Get user's subscriptions
app.get("/user/:address", async (c) => {
  try {
    const address = c.req.param("address");
    const active = c.req.query("active");

    const conditions = [`subscriber = '${address.toLowerCase()}'`];

    if (active !== undefined) {
      conditions.push(`active = ${active === "true"}`);
    }

    const subscriptions = await sql.unsafe(`
      SELECT
        s.id,
        s.plan_id as "planId",
        s.subscriber,
        s.started_at::text as "startedAt",
        s.current_period_end::text as "currentPeriodEnd",
        s.active,
        s.cancelled,
        s.is_trial as "isTrial",
        s.total_paid::text as "totalPaid",
        s.renewal_count as "renewalCount",
        p.price::text as "planPrice",
        p.interval_days as "planIntervalDays"
      FROM subscriptions s
      LEFT JOIN subscription_plans p ON s.plan_id = p.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY s.started_at DESC
    `);

    return c.json({ data: subscriptions });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /subscriptions/:id/renewals - Get subscription renewals
app.get("/:id/renewals", async (c) => {
  try {
    const id = c.req.param("id");

    const renewals = await sql`
      SELECT
        id,
        sub_id as "subId",
        new_period_end::text as "newPeriodEnd",
        amount::text,
        renewed_by as "renewedBy",
        timestamp::text,
        tx_hash as "txHash"
      FROM subscription_renewals
      WHERE sub_id = ${id}
      ORDER BY timestamp DESC
    `;

    return c.json({ data: renewals });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

export default app;
