import { ponder } from "ponder:registry";
import {
  paywalls,
  paywallUnlocks,
  directPayments,
  refundRequests,
} from "../ponder.schema";

// PaywallCreated event handler
// Note: Deployed contract only emits (id, creator, price, splitAddress) - no x402Enabled/refundable
ponder.on("TwinklePay:PaywallCreated", async ({ event, context }) => {
  const { db } = context;

  await db.insert(paywalls).values({
    id: event.args.id,
    creator: event.args.creator,
    price: event.args.price,
    splitAddress: event.args.splitAddress === "0x0000000000000000000000000000000000000000"
      ? null
      : event.args.splitAddress,
    x402Enabled: true, // Default - not available in event
    refundable: false, // Default - not available in event
    active: true,
    totalUnlocks: 0,
    totalRevenue: 0n,
    createdAt: event.block.timestamp,
    createdBlock: event.block.number,
    createdTxHash: event.transaction.hash,
  });
});

// PaywallUpdated event handler
ponder.on("TwinklePay:PaywallUpdated", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(paywalls, { id: event.args.id })
    .set({
      price: event.args.newPrice,
      active: event.args.active,
    });
});

// PaymentReceived event handler (paywall unlock)
ponder.on("TwinklePay:PaymentReceived", async ({ event, context }) => {
  const { db } = context;

  const unlockId = `${event.args.paywallId}-${event.args.payer}`;

  // Insert unlock record
  await db.insert(paywallUnlocks).values({
    id: unlockId,
    paywallId: event.args.paywallId,
    user: event.args.payer,
    amount: event.args.amount,
    platformFee: event.args.platformFee,
    unlockedAt: event.block.timestamp,
    txHash: event.transaction.hash,
  });

  // Update paywall stats
  const paywall = await db.find(paywalls, { id: event.args.paywallId });
  if (paywall) {
    await db
      .update(paywalls, { id: event.args.paywallId })
      .set({
        totalUnlocks: paywall.totalUnlocks + 1,
        totalRevenue: paywall.totalRevenue + event.args.amount,
      });
  }
});

// DirectPayment event handler
// Note: Deployed contract only emits (from, to, amount) - no platformFee
ponder.on("TwinklePay:DirectPayment", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(directPayments).values({
    id,
    from: event.args.from,
    to: event.args.to,
    amount: event.args.amount,
    platformFee: 0n, // Not available in deployed contract event
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
  });
});

// RefundRequested event handler
ponder.on("TwinklePay:RefundRequested", async ({ event, context }) => {
  const { db } = context;

  await db.insert(refundRequests).values({
    id: event.args.refundId,
    paywallId: event.args.paywallId,
    requester: event.args.requester,
    amount: event.args.amount,
    reason: event.args.reason,
    requestedAt: event.block.timestamp,
    approved: false,
    processed: false,
    rejected: false,
    txHash: event.transaction.hash,
  });
});

// RefundApproved event handler
ponder.on("TwinklePay:RefundApproved", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(refundRequests, { id: event.args.refundId })
    .set({ approved: true });
});

// RefundProcessed event handler
ponder.on("TwinklePay:RefundProcessed", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(refundRequests, { id: event.args.refundId })
    .set({ processed: true });
});

// RefundRejected event handler
ponder.on("TwinklePay:RefundRejected", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(refundRequests, { id: event.args.refundId })
    .set({ rejected: true });
});
