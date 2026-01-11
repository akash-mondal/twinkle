import { ponder } from "ponder:registry";
import { splits, splitDistributions, splitWithdrawals } from "../ponder.schema";

// SplitCreated event handler
ponder.on("TwinkleSplit:SplitCreated", async ({ event, context }) => {
  const { db } = context;

  // Compute recipients hash from the recipients and percentages arrays
  const recipientsHash = `0x${"0".repeat(64)}` as `0x${string}`; // Placeholder - actual hash computed from args

  await db.insert(splits).values({
    id: event.args.id,
    creator: event.args.creator,
    mutable: event.args.mutable_,
    active: true,
    recipientsHash,
    totalDistributed: 0n,
    balance: 0n,
    createdAt: event.block.timestamp,
    createdTxHash: event.transaction.hash,
  });
});

// SplitUpdated event handler
ponder.on("TwinkleSplit:SplitUpdated", async ({ event, context }) => {
  const { db } = context;

  // Compute new recipients hash
  const recipientsHash = `0x${"0".repeat(64)}` as `0x${string}`;

  await db
    .update(splits, { id: event.args.id })
    .set({ recipientsHash });
});

// SplitDeactivated event handler
ponder.on("TwinkleSplit:SplitDeactivated", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(splits, { id: event.args.id })
    .set({ active: false });
});

// SplitReactivated event handler
ponder.on("TwinkleSplit:SplitReactivated", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(splits, { id: event.args.id })
    .set({ active: true });
});

// FundsReceived event handler
ponder.on("TwinkleSplit:FundsReceived", async ({ event, context }) => {
  const { db } = context;

  const split = await db.find(splits, { id: event.args.splitId });
  if (split) {
    await db
      .update(splits, { id: event.args.splitId })
      .set({ balance: split.balance + event.args.amount });
  }
});

// Distributed event handler
ponder.on("TwinkleSplit:Distributed", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  // Insert distribution record
  await db.insert(splitDistributions).values({
    id,
    splitId: event.args.splitId,
    amount: event.args.amount,
    recipientCount: Number(event.args.recipientCount),
    platformFee: event.args.platformFee,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });

  // Update split totals
  const split = await db.find(splits, { id: event.args.splitId });
  if (split) {
    await db
      .update(splits, { id: event.args.splitId })
      .set({
        totalDistributed: split.totalDistributed + event.args.amount,
      });
  }
});

// Withdrawn event handler
ponder.on("TwinkleSplit:Withdrawn", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(splitWithdrawals).values({
    id,
    splitId: event.args.splitId,
    recipient: event.args.recipient,
    amount: event.args.amount,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});
