import { ponder } from "ponder:registry";
import {
  paymentRequests,
  x402Settlements,
  agentPayments,
  accessProofs,
} from "../ponder.schema";

// PaymentRequestCreated event handler
ponder.on("TwinkleX402:PaymentRequestCreated", async ({ event, context }) => {
  const { db } = context;

  await db.insert(paymentRequests).values({
    id: event.args.requestId,
    payTo: event.args.payTo,
    amount: event.args.amount,
    paywallId: event.args.paywallId === "0x0000000000000000000000000000000000000000000000000000000000000000"
      ? null
      : event.args.paywallId,
    validUntil: event.args.validUntil,
    creator: event.args.creator,
    settled: false,
    cancelled: false,
    createdAt: event.block.timestamp,
    createdTxHash: event.transaction.hash,
  });
});

// PaymentRequestCancelled event handler
ponder.on("TwinkleX402:PaymentRequestCancelled", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(paymentRequests, { id: event.args.requestId })
    .set({ cancelled: true });
});

// PaymentSettled event handler
ponder.on("TwinkleX402:PaymentSettled", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  // Insert settlement record
  await db.insert(x402Settlements).values({
    id,
    requestId: event.args.requestId,
    from: event.args.from,
    payTo: event.args.payTo,
    amount: event.args.amount,
    platformFee: event.args.platformFee,
    accessProofId: event.args.accessProofId,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
  });

  // Mark request as settled
  await db
    .update(paymentRequests, { id: event.args.requestId })
    .set({ settled: true });
});

// AgentPaymentSettled event handler
ponder.on("TwinkleX402:AgentPaymentSettled", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(agentPayments).values({
    id,
    requestId: event.args.requestId,
    agentId: event.args.agentId,
    agentType: event.args.agentType,
    sessionId: event.args.sessionId === "0x0000000000000000000000000000000000000000000000000000000000000000"
      ? null
      : event.args.sessionId,
    amount: event.args.amount,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});

// ContentAccessGranted event handler (creates access proof record)
ponder.on("TwinkleX402:ContentAccessGranted", async ({ event, context }) => {
  const { db } = context;

  // Get the payment request to populate proof details
  const request = await db.find(paymentRequests, { id: event.args.requestId });

  if (request) {
    await db.insert(accessProofs).values({
      id: event.args.accessProofId,
      requestId: event.args.requestId,
      payer: event.args.payer,
      recipient: request.payTo,
      amount: request.amount,
      paywallId: event.args.paywallId === "0x0000000000000000000000000000000000000000000000000000000000000000"
        ? null
        : event.args.paywallId,
      createdAt: event.block.timestamp,
      blockNumber: event.block.number,
      revoked: false,
      txHash: event.transaction.hash,
    });
  }
});

// AccessProofRevoked event handler
ponder.on("TwinkleX402:AccessProofRevoked", async ({ event, context }) => {
  const { db } = context;

  await db
    .update(accessProofs, { id: event.args.accessProofId })
    .set({ revoked: true });
});
