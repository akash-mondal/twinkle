import { ponder } from "ponder:registry";
import { protocolEvents, feeCollections } from "../ponder.schema";

// ProtocolPaused event handler
ponder.on("TwinkleCore:ProtocolPaused", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(protocolEvents).values({
    id,
    eventType: "protocol_paused",
    triggeredBy: event.args.by,
    timestamp: event.args.timestamp,
    txHash: event.transaction.hash,
  });
});

// ProtocolUnpaused event handler
ponder.on("TwinkleCore:ProtocolUnpaused", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(protocolEvents).values({
    id,
    eventType: "protocol_unpaused",
    triggeredBy: event.args.by,
    timestamp: event.args.timestamp,
    txHash: event.transaction.hash,
  });
});

// CircuitBreakerActivated event handler
ponder.on("TwinkleCore:CircuitBreakerActivated", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(protocolEvents).values({
    id,
    eventType: "circuit_breaker_activated",
    triggeredBy: event.args.by,
    timestamp: event.args.timestamp,
    txHash: event.transaction.hash,
  });
});

// CircuitBreakerDeactivated event handler
ponder.on("TwinkleCore:CircuitBreakerDeactivated", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(protocolEvents).values({
    id,
    eventType: "circuit_breaker_deactivated",
    triggeredBy: event.args.by,
    timestamp: event.args.timestamp,
    txHash: event.transaction.hash,
  });
});

// FeeCollected event handler
ponder.on("TwinkleCore:FeeCollected", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(feeCollections).values({
    id,
    from: event.args.from,
    to: event.args.to,
    amount: event.args.amount,
    fee: event.args.fee,
    paymentType: event.args.paymentType,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});

// PlatformFeeUpdated event handler
ponder.on("TwinkleCore:PlatformFeeUpdated", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(protocolEvents).values({
    id,
    eventType: "fee_updated",
    triggeredBy: "0x0000000000000000000000000000000000000000", // Owner
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    data: JSON.stringify({
      oldFee: event.args.oldFee.toString(),
      newFee: event.args.newFee.toString(),
    }),
  });
});

// TreasuryUpdated event handler
ponder.on("TwinkleCore:TreasuryUpdated", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(protocolEvents).values({
    id,
    eventType: "treasury_updated",
    triggeredBy: event.args.oldTreasury,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    data: JSON.stringify({
      oldTreasury: event.args.oldTreasury,
      newTreasury: event.args.newTreasury,
    }),
  });
});

// OperatorUpdated event handler
ponder.on("TwinkleCore:OperatorUpdated", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(protocolEvents).values({
    id,
    eventType: "operator_updated",
    triggeredBy: event.args.operator,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    data: JSON.stringify({ status: event.args.status }),
  });
});

// EmergencyOperatorUpdated event handler
ponder.on("TwinkleCore:EmergencyOperatorUpdated", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(protocolEvents).values({
    id,
    eventType: "emergency_operator_updated",
    triggeredBy: event.args.operator,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    data: JSON.stringify({ status: event.args.status }),
  });
});

// ContractRegistered event handler
ponder.on("TwinkleCore:ContractRegistered", async ({ event, context }) => {
  const { db } = context;

  const id = `${event.transaction.hash}-${event.log.logIndex}`;

  await db.insert(protocolEvents).values({
    id,
    eventType: "contract_registered",
    triggeredBy: event.args.contractAddress,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    data: JSON.stringify({ key: event.args.key }),
  });
});
