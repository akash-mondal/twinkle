import { ponder } from "ponder:registry";
import {
  subscriptionPlans,
  subscriptions,
  subscriptionRenewals,
} from "../ponder.schema";

// PlanCreated event handler
ponder.on("TwinkleSubscription:PlanCreated", async ({ event, context }) => {
  const { db } = context;

  await db.insert(subscriptionPlans).values({
    id: event.args.id,
    creator: event.args.creator,
    price: event.args.price,
    intervalDays: event.args.intervalDays,
    trialDays: event.args.trialDays,
    active: true,
    subscriberCount: 0,
    totalRevenue: 0n,
    createdAt: event.block.timestamp,
    createdTxHash: event.transaction.hash,
  });
});

// PlanUpdated event handler
ponder.on("TwinkleSubscription:PlanUpdated", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(subscriptionPlans, { id: event.args.id })
    .set({
      price: event.args.newPrice,
      active: event.args.active,
    });
});

// Subscribed event handler
ponder.on("TwinkleSubscription:Subscribed", async ({ event, context }) => {
  const { db } = context;

  // Insert subscription
  await db.insert(subscriptions).values({
    id: event.args.subId,
    planId: event.args.planId,
    subscriber: event.args.subscriber,
    startedAt: event.block.timestamp,
    currentPeriodEnd: BigInt(event.args.periodEnd),
    active: true,
    cancelled: false,
    isTrial: event.args.isTrial,
    totalPaid: 0n,
    renewalCount: 0,
    createdTxHash: event.transaction.hash,
  });

  // Update plan subscriber count
  const plan = await db.find(subscriptionPlans, { id: event.args.planId });
  if (plan) {
    await db
      .update(subscriptionPlans, { id: event.args.planId })
      .set({ subscriberCount: plan.subscriberCount + 1 });
  }
});

// Renewed event handler
ponder.on("TwinkleSubscription:Renewed", async ({ event, context }) => {
  const { db } = context;

  const renewalId = `${event.transaction.hash}-${event.log.logIndex}`;

  // Insert renewal record
  await db.insert(subscriptionRenewals).values({
    id: renewalId,
    subId: event.args.subId,
    newPeriodEnd: BigInt(event.args.newPeriodEnd),
    amount: event.args.amount,
    renewedBy: event.args.renewedBy,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });

  // Update subscription
  const sub = await db.find(subscriptions, { id: event.args.subId });
  if (sub) {
    await db
      .update(subscriptions, { id: event.args.subId })
      .set({
        currentPeriodEnd: BigInt(event.args.newPeriodEnd),
        totalPaid: sub.totalPaid + event.args.amount,
        renewalCount: sub.renewalCount + 1,
      });

    // Update plan revenue
    const plan = await db.find(subscriptionPlans, { id: sub.planId });
    if (plan) {
      await db
        .update(subscriptionPlans, { id: sub.planId })
        .set({ totalRevenue: plan.totalRevenue + event.args.amount });
    }
  }
});

// Cancelled event handler
ponder.on("TwinkleSubscription:Cancelled", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(subscriptions, { id: event.args.subId })
    .set({ cancelled: true });
});

// SubscriptionEnded event handler
ponder.on("TwinkleSubscription:SubscriptionEnded", async ({ event, context }) => {
  const { db } = context;

  const sub = await db.find(subscriptions, { id: event.args.subId });

  await db
    .update(subscriptions, { id: event.args.subId })
    .set({ active: false });

  // Update plan subscriber count
  if (sub) {
    const plan = await db.find(subscriptionPlans, { id: sub.planId });
    if (plan && plan.subscriberCount > 0) {
      await db
        .update(subscriptionPlans, { id: sub.planId })
        .set({ subscriberCount: plan.subscriberCount - 1 });
    }
  }
});
