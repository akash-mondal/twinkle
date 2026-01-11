import { ponder } from "ponder:registry";
import { projects, milestones, disputes } from "../ponder.schema";

// ProjectCreated event handler
ponder.on("TwinkleEscrow:ProjectCreated", async ({ event, context }) => {
  const { db } = context;

  await db.insert(projects).values({
    id: event.args.id,
    freelancer: event.args.freelancer,
    client: event.args.client,
    status: 0, // AwaitingFunding
    totalAmount: event.args.totalAmount,
    fundedAmount: 0n,
    releasedAmount: 0n,
    milestoneCount: 0, // Not available in on-chain event, will be derived from milestones
    approvalTimeoutDays: 14, // Default value, actual value from contract getter
    createdAt: event.block.timestamp,
    createdTxHash: event.transaction.hash,
  });
});

// ProjectFunded event handler
ponder.on("TwinkleEscrow:ProjectFunded", async ({ event, context }) => {
  const { db } = context;

  const project = await db.find(projects, { id: event.args.id });
  if (project) {
    await db
      .update(projects, { id: event.args.id })
      .set({
        fundedAmount: project.fundedAmount + event.args.amount,
        status: 1, // Active
      });
  }
});

// MilestoneRequested event handler
ponder.on("TwinkleEscrow:MilestoneRequested", async ({ event, context }) => {
  const { db } = context;

  const milestoneId = `${event.args.projectId}-${event.args.milestoneIndex}`;

  // Upsert milestone
  const existing = await db.find(milestones, { id: milestoneId });
  if (existing) {
    await db
      .update(milestones, { id: milestoneId })
      .set({
        status: 1, // Requested
        requestedAt: event.block.timestamp,
      });
  } else {
    // Create milestone if it doesn't exist yet
    await db.insert(milestones).values({
      id: milestoneId,
      projectId: event.args.projectId,
      index: Number(event.args.milestoneIndex),
      amount: 0n, // Will be updated when approved
      status: 1, // Requested
      streamDurationDays: 0,
      requestedAt: event.block.timestamp,
    });
  }
});

// MilestoneApproved event handler
ponder.on("TwinkleEscrow:MilestoneApproved", async ({ event, context }) => {
  const { db } = context;

  const milestoneId = `${event.args.projectId}-${event.args.milestoneIndex}`;

  const existing = await db.find(milestones, { id: milestoneId });
  if (existing) {
    await db
      .update(milestones, { id: milestoneId })
      .set({
        status: 2, // Approved
        amount: event.args.amount,
        streamId: event.args.streamId > 0n ? event.args.streamId : null,
        approvedAt: event.block.timestamp,
      });
  } else {
    await db.insert(milestones).values({
      id: milestoneId,
      projectId: event.args.projectId,
      index: Number(event.args.milestoneIndex),
      amount: event.args.amount,
      status: 2, // Approved
      streamDurationDays: 0,
      streamId: event.args.streamId > 0n ? event.args.streamId : null,
      approvedAt: event.block.timestamp,
    });
  }

  // Update project released amount
  const project = await db.find(projects, { id: event.args.projectId });
  if (project) {
    await db
      .update(projects, { id: event.args.projectId })
      .set({
        releasedAmount: project.releasedAmount + event.args.amount,
      });
  }
});

// MilestoneCompleted event handler
ponder.on("TwinkleEscrow:MilestoneCompleted", async ({ event, context }) => {
  const { db } = context;

  const milestoneId = `${event.args.projectId}-${event.args.milestoneIndex}`;

  await db
    .update(milestones, { id: milestoneId })
    .set({ status: 3 }); // Released
});

// ProjectCompleted event handler
ponder.on("TwinkleEscrow:ProjectCompleted", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(projects, { id: event.args.projectId })
    .set({ status: 2 }); // Completed
});

// ProjectCancelled event handler
ponder.on("TwinkleEscrow:ProjectCancelled", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(projects, { id: event.args.projectId })
    .set({ status: 4 }); // Cancelled
});

// DisputeOpened event handler
ponder.on("TwinkleEscrow:DisputeOpened", async ({ event, context }) => {
  const { db } = context;

  // Update project status
  await db
    .update(projects, { id: event.args.projectId })
    .set({ status: 3 }); // Disputed

  // Update milestone status
  const milestoneId = `${event.args.projectId}-${event.args.milestoneIndex}`;
  await db
    .update(milestones, { id: milestoneId })
    .set({ status: 4 }); // Disputed

  // Insert dispute record
  await db.insert(disputes).values({
    id: event.args.projectId.toString(),
    projectId: event.args.projectId,
    milestoneIndex: Number(event.args.milestoneIndex),
    disputedBy: event.args.disputedBy,
    reason: event.args.reason,
    createdAt: event.block.timestamp,
    resolved: false,
    txHash: event.transaction.hash,
  });
});

// DisputeResolved event handler
ponder.on("TwinkleEscrow:DisputeResolved", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(disputes, { id: event.args.projectId.toString() })
    .set({
      resolved: true,
      freelancerWins: event.args.freelancerWins,
      amount: event.args.amount,
      arbitratorFee: event.args.arbitratorFee,
    });
});
