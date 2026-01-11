/**
 * Projects (Escrow) API Module
 */

import { Hono } from "hono";
import { sql } from "../db.js";

const app = new Hono();

// Project status enum
const PROJECT_STATUS = {
  0: "AwaitingFunding",
  1: "Active",
  2: "Completed",
  3: "Disputed",
  4: "Cancelled",
} as const;

const MILESTONE_STATUS = {
  0: "Pending",
  1: "Requested",
  2: "Approved",
  3: "Released",
  4: "Disputed",
} as const;

// GET /projects - List projects
app.get("/", async (c) => {
  try {
    const freelancer = c.req.query("freelancer");
    const client = c.req.query("client");
    const status = c.req.query("status");
    const limit = Number(c.req.query("limit") || 20);
    const offset = Number(c.req.query("offset") || 0);

    const conditions: string[] = [];

    if (freelancer) {
      conditions.push(`freelancer = '${freelancer.toLowerCase()}'`);
    }

    if (client) {
      conditions.push(`client = '${client.toLowerCase()}'`);
    }

    if (status !== undefined) {
      conditions.push(`status = ${status}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const projects = await sql.unsafe(`
      SELECT
        id,
        freelancer,
        client,
        status,
        total_amount::text as "totalAmount",
        funded_amount::text as "fundedAmount",
        released_amount::text as "releasedAmount",
        milestone_count as "milestoneCount",
        arbitrator,
        arbitrator_fee_bps as "arbitratorFeeBps",
        approval_timeout_days as "approvalTimeoutDays",
        split_address as "splitAddress",
        created_at::text as "createdAt"
      FROM projects
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    // Add status labels
    const projectsWithLabels = projects.map((p: Record<string, unknown>) => ({
      ...p,
      statusLabel: PROJECT_STATUS[p.status as keyof typeof PROJECT_STATUS] || "Unknown",
    }));

    return c.json({ data: projectsWithLabels });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /projects/:id - Get project details
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const projects = await sql`
      SELECT
        id,
        freelancer,
        client,
        status,
        total_amount::text as "totalAmount",
        funded_amount::text as "fundedAmount",
        released_amount::text as "releasedAmount",
        milestone_count as "milestoneCount",
        arbitrator,
        arbitrator_fee_bps as "arbitratorFeeBps",
        approval_timeout_days as "approvalTimeoutDays",
        split_address as "splitAddress",
        created_at::text as "createdAt",
        created_tx_hash as "createdTxHash"
      FROM projects
      WHERE id = ${id}
    `;

    if (projects.length === 0) {
      return c.json({ error: "Project not found" }, 404);
    }

    const project = {
      ...projects[0],
      statusLabel: PROJECT_STATUS[projects[0].status as keyof typeof PROJECT_STATUS] || "Unknown",
    };

    // Get milestones
    const milestones = await sql`
      SELECT
        id,
        project_id as "projectId",
        index,
        amount::text,
        status,
        stream_duration_days as "streamDurationDays",
        stream_id::text as "streamId",
        requested_at::text as "requestedAt",
        approved_at::text as "approvedAt"
      FROM milestones
      WHERE project_id = ${id}
      ORDER BY index ASC
    `;

    const milestonesWithLabels = milestones.map((m: Record<string, unknown>) => ({
      ...m,
      statusLabel: MILESTONE_STATUS[m.status as keyof typeof MILESTONE_STATUS] || "Unknown",
    }));

    return c.json({
      data: {
        ...project,
        milestones: milestonesWithLabels,
      },
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /projects/:id/milestones - Get project milestones
app.get("/:id/milestones", async (c) => {
  try {
    const id = c.req.param("id");

    const milestones = await sql`
      SELECT
        id,
        project_id as "projectId",
        index,
        amount::text,
        status,
        stream_duration_days as "streamDurationDays",
        stream_id::text as "streamId",
        requested_at::text as "requestedAt",
        approved_at::text as "approvedAt"
      FROM milestones
      WHERE project_id = ${id}
      ORDER BY index ASC
    `;

    const milestonesWithLabels = milestones.map((m: Record<string, unknown>) => ({
      ...m,
      statusLabel: MILESTONE_STATUS[m.status as keyof typeof MILESTONE_STATUS] || "Unknown",
    }));

    return c.json({ data: milestonesWithLabels });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

// GET /projects/:id/dispute - Get project dispute
app.get("/:id/dispute", async (c) => {
  try {
    const id = c.req.param("id");

    const disputes = await sql`
      SELECT
        id,
        project_id as "projectId",
        milestone_index as "milestoneIndex",
        disputed_by as "disputedBy",
        reason,
        created_at::text as "createdAt",
        resolved,
        freelancer_wins as "freelancerWins",
        amount::text,
        arbitrator_fee::text as "arbitratorFee",
        tx_hash as "txHash"
      FROM disputes
      WHERE project_id = ${id}
    `;

    if (disputes.length === 0) {
      return c.json({ data: null });
    }

    return c.json({ data: disputes[0] });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      500
    );
  }
});

export default app;
