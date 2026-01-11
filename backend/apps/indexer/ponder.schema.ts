import { onchainTable, relations, index } from "ponder";

// =============================================================================
// TwinklePay Schema
// =============================================================================

export const paywalls = onchainTable("paywalls", (t) => ({
  id: t.hex().primaryKey(), // bytes32 paywall ID
  creator: t.hex().notNull(),
  price: t.bigint().notNull(),
  splitAddress: t.hex(),
  totalUnlocks: t.integer().notNull().default(0),
  totalRevenue: t.bigint().notNull().default(0n),
  active: t.boolean().notNull().default(true),
  x402Enabled: t.boolean().notNull().default(false),
  refundable: t.boolean().notNull().default(false),
  createdAt: t.bigint().notNull(),
  createdBlock: t.bigint().notNull(),
  createdTxHash: t.hex().notNull(),
}), (table) => ({
  creatorIdx: index().on(table.creator),
  activeIdx: index().on(table.active),
}));

export const paywallUnlocks = onchainTable("paywall_unlocks", (t) => ({
  id: t.text().primaryKey(), // `${paywallId}-${user}`
  paywallId: t.hex().notNull(),
  user: t.hex().notNull(),
  amount: t.bigint().notNull(),
  platformFee: t.bigint().notNull(),
  unlockedAt: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}), (table) => ({
  paywallIdx: index().on(table.paywallId),
  userIdx: index().on(table.user),
}));

export const directPayments = onchainTable("direct_payments", (t) => ({
  id: t.text().primaryKey(), // `${txHash}-${logIndex}`
  from: t.hex().notNull(),
  to: t.hex().notNull(),
  amount: t.bigint().notNull(),
  platformFee: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
}), (table) => ({
  fromIdx: index().on(table.from),
  toIdx: index().on(table.to),
  timestampIdx: index().on(table.timestamp),
}));

export const refundRequests = onchainTable("refund_requests", (t) => ({
  id: t.hex().primaryKey(), // refundId
  paywallId: t.hex().notNull(),
  requester: t.hex().notNull(),
  amount: t.bigint().notNull(),
  reason: t.text(),
  requestedAt: t.bigint().notNull(),
  approved: t.boolean().notNull().default(false),
  processed: t.boolean().notNull().default(false),
  rejected: t.boolean().notNull().default(false),
  txHash: t.hex().notNull(),
}), (table) => ({
  paywallIdx: index().on(table.paywallId),
  requesterIdx: index().on(table.requester),
}));

// =============================================================================
// TwinkleX402 Schema
// =============================================================================

export const paymentRequests = onchainTable("payment_requests", (t) => ({
  id: t.hex().primaryKey(), // requestId
  payTo: t.hex().notNull(),
  amount: t.bigint().notNull(),
  paywallId: t.hex(),
  validUntil: t.bigint().notNull(),
  creator: t.hex().notNull(),
  settled: t.boolean().notNull().default(false),
  cancelled: t.boolean().notNull().default(false),
  createdAt: t.bigint().notNull(),
  createdTxHash: t.hex().notNull(),
}), (table) => ({
  payToIdx: index().on(table.payTo),
  creatorIdx: index().on(table.creator),
  settledIdx: index().on(table.settled),
}));

export const x402Settlements = onchainTable("x402_settlements", (t) => ({
  id: t.text().primaryKey(), // `${txHash}-${logIndex}`
  requestId: t.hex().notNull(),
  from: t.hex().notNull(),
  payTo: t.hex().notNull(),
  amount: t.bigint().notNull(),
  platformFee: t.bigint().notNull(),
  accessProofId: t.hex().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
}), (table) => ({
  requestIdx: index().on(table.requestId),
  fromIdx: index().on(table.from),
  payToIdx: index().on(table.payTo),
  timestampIdx: index().on(table.timestamp),
}));

export const agentPayments = onchainTable("agent_payments", (t) => ({
  id: t.text().primaryKey(), // `${txHash}-${logIndex}`
  requestId: t.hex().notNull(),
  agentId: t.hex().notNull(),
  agentType: t.text().notNull(),
  sessionId: t.hex(),
  amount: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}), (table) => ({
  agentIdx: index().on(table.agentId),
  agentTypeIdx: index().on(table.agentType),
  sessionIdx: index().on(table.sessionId),
}));

export const accessProofs = onchainTable("access_proofs", (t) => ({
  id: t.hex().primaryKey(), // accessProofId
  requestId: t.hex().notNull(),
  payer: t.hex().notNull(),
  recipient: t.hex().notNull(),
  amount: t.bigint().notNull(),
  paywallId: t.hex(),
  createdAt: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  revoked: t.boolean().notNull().default(false),
  txHash: t.hex().notNull(),
}), (table) => ({
  payerIdx: index().on(table.payer),
  paywallIdx: index().on(table.paywallId),
}));

// =============================================================================
// TwinkleSubscription Schema
// =============================================================================

export const subscriptionPlans = onchainTable("subscription_plans", (t) => ({
  id: t.hex().primaryKey(), // planId
  creator: t.hex().notNull(),
  price: t.bigint().notNull(),
  intervalDays: t.integer().notNull(),
  trialDays: t.integer().notNull().default(0),
  splitAddress: t.hex(),
  active: t.boolean().notNull().default(true),
  subscriberCount: t.integer().notNull().default(0),
  totalRevenue: t.bigint().notNull().default(0n),
  createdAt: t.bigint().notNull(),
  createdTxHash: t.hex().notNull(),
}), (table) => ({
  creatorIdx: index().on(table.creator),
  activeIdx: index().on(table.active),
}));

export const subscriptions = onchainTable("subscriptions", (t) => ({
  id: t.hex().primaryKey(), // subId
  planId: t.hex().notNull(),
  subscriber: t.hex().notNull(),
  startedAt: t.bigint().notNull(),
  currentPeriodEnd: t.bigint().notNull(),
  active: t.boolean().notNull().default(true),
  cancelled: t.boolean().notNull().default(false),
  isTrial: t.boolean().notNull().default(false),
  totalPaid: t.bigint().notNull().default(0n),
  renewalCount: t.integer().notNull().default(0),
  createdTxHash: t.hex().notNull(),
}), (table) => ({
  planIdx: index().on(table.planId),
  subscriberIdx: index().on(table.subscriber),
  activeIdx: index().on(table.active),
}));

export const subscriptionRenewals = onchainTable("subscription_renewals", (t) => ({
  id: t.text().primaryKey(), // `${txHash}-${logIndex}`
  subId: t.hex().notNull(),
  newPeriodEnd: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  renewedBy: t.hex().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}), (table) => ({
  subIdx: index().on(table.subId),
  timestampIdx: index().on(table.timestamp),
}));

// =============================================================================
// TwinkleEscrow Schema
// =============================================================================

export const projects = onchainTable("projects", (t) => ({
  id: t.hex().primaryKey(), // projectId
  freelancer: t.hex().notNull(),
  client: t.hex().notNull(),
  status: t.integer().notNull().default(0), // ProjectStatus enum
  totalAmount: t.bigint().notNull(),
  fundedAmount: t.bigint().notNull().default(0n),
  releasedAmount: t.bigint().notNull().default(0n),
  milestoneCount: t.integer().notNull(),
  arbitrator: t.hex(),
  arbitratorFeeBps: t.integer().notNull().default(0),
  approvalTimeoutDays: t.integer().notNull(),
  splitAddress: t.hex(),
  createdAt: t.bigint().notNull(),
  createdTxHash: t.hex().notNull(),
}), (table) => ({
  freelancerIdx: index().on(table.freelancer),
  clientIdx: index().on(table.client),
  statusIdx: index().on(table.status),
}));

export const milestones = onchainTable("milestones", (t) => ({
  id: t.text().primaryKey(), // `${projectId}-${index}`
  projectId: t.hex().notNull(),
  index: t.integer().notNull(),
  amount: t.bigint().notNull(),
  status: t.integer().notNull().default(0), // MilestoneStatus enum
  streamDurationDays: t.integer().notNull().default(0),
  streamId: t.bigint(),
  requestedAt: t.bigint(),
  approvedAt: t.bigint(),
}), (table) => ({
  projectIdx: index().on(table.projectId),
  statusIdx: index().on(table.status),
}));

export const disputes = onchainTable("disputes", (t) => ({
  id: t.text().primaryKey(), // `${projectId}`
  projectId: t.hex().notNull(),
  milestoneIndex: t.integer().notNull(),
  disputedBy: t.hex().notNull(),
  reason: t.text(),
  createdAt: t.bigint().notNull(),
  resolved: t.boolean().notNull().default(false),
  freelancerWins: t.boolean(),
  amount: t.bigint(),
  arbitratorFee: t.bigint(),
  txHash: t.hex().notNull(),
}), (table) => ({
  projectIdx: index().on(table.projectId),
  disputedByIdx: index().on(table.disputedBy),
}));

// =============================================================================
// TwinkleSplit Schema
// =============================================================================

export const splits = onchainTable("splits", (t) => ({
  id: t.hex().primaryKey(), // splitId
  creator: t.hex().notNull(),
  mutable: t.boolean().notNull(),
  active: t.boolean().notNull().default(true),
  recipientsHash: t.hex().notNull(),
  totalDistributed: t.bigint().notNull().default(0n),
  balance: t.bigint().notNull().default(0n),
  createdAt: t.bigint().notNull(),
  createdTxHash: t.hex().notNull(),
}), (table) => ({
  creatorIdx: index().on(table.creator),
  activeIdx: index().on(table.active),
}));

export const splitDistributions = onchainTable("split_distributions", (t) => ({
  id: t.text().primaryKey(), // `${txHash}-${logIndex}`
  splitId: t.hex().notNull(),
  amount: t.bigint().notNull(),
  recipientCount: t.integer().notNull(),
  platformFee: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}), (table) => ({
  splitIdx: index().on(table.splitId),
  timestampIdx: index().on(table.timestamp),
}));

export const splitWithdrawals = onchainTable("split_withdrawals", (t) => ({
  id: t.text().primaryKey(), // `${txHash}-${logIndex}`
  splitId: t.hex().notNull(),
  recipient: t.hex().notNull(),
  amount: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}), (table) => ({
  splitIdx: index().on(table.splitId),
  recipientIdx: index().on(table.recipient),
}));

// =============================================================================
// TwinkleCore Schema
// =============================================================================

export const protocolEvents = onchainTable("protocol_events", (t) => ({
  id: t.text().primaryKey(), // `${txHash}-${logIndex}`
  eventType: t.text().notNull(), // 'pause', 'unpause', 'circuit_breaker', etc.
  triggeredBy: t.hex().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  data: t.text(), // JSON encoded additional data
}), (table) => ({
  eventTypeIdx: index().on(table.eventType),
  timestampIdx: index().on(table.timestamp),
}));

export const feeCollections = onchainTable("fee_collections", (t) => ({
  id: t.text().primaryKey(), // `${txHash}-${logIndex}`
  from: t.hex().notNull(),
  to: t.hex().notNull(),
  amount: t.bigint().notNull(),
  fee: t.bigint().notNull(),
  paymentType: t.hex().notNull(), // bytes32 encoded type
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}), (table) => ({
  fromIdx: index().on(table.from),
  toIdx: index().on(table.to),
  paymentTypeIdx: index().on(table.paymentType),
  timestampIdx: index().on(table.timestamp),
}));

// =============================================================================
// Analytics / Aggregates
// =============================================================================

export const dailyStats = onchainTable("daily_stats", (t) => ({
  id: t.text().primaryKey(), // `${date}` YYYY-MM-DD
  date: t.text().notNull(),
  totalPayments: t.integer().notNull().default(0),
  totalVolume: t.bigint().notNull().default(0n),
  totalFees: t.bigint().notNull().default(0n),
  uniquePayers: t.integer().notNull().default(0),
  uniqueRecipients: t.integer().notNull().default(0),
  paywallUnlocks: t.integer().notNull().default(0),
  subscriptionRenewals: t.integer().notNull().default(0),
  escrowFundings: t.integer().notNull().default(0),
  x402Settlements: t.integer().notNull().default(0),
}), (table) => ({
  dateIdx: index().on(table.date),
}));
