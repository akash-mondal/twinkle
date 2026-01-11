/**
 * Contract-related types matching Solidity definitions
 */

/**
 * PaymentIntent struct from TwinkleX402
 */
export interface PaymentIntent {
  payer: `0x${string}`;
  requestId: `0x${string}`;
  amount: bigint;
  validUntil: bigint;
  nonce: bigint;
}

/**
 * PaymentRequest from TwinkleX402
 */
export interface PaymentRequest {
  payTo: `0x${string}`;
  amount: bigint;
  paywallId: `0x${string}`;
  validUntil: bigint;
  settled: boolean;
}

/**
 * ProjectStatus enum from TwinkleEscrow
 */
export enum ProjectStatus {
  AwaitingFunding = 0,
  Active = 1,
  Completed = 2,
  Disputed = 3,
  Cancelled = 4,
}

/**
 * MilestoneStatus enum from TwinkleEscrow
 */
export enum MilestoneStatus {
  Pending = 0,
  Requested = 1,
  Approved = 2,
  Released = 3,
  Disputed = 4,
}

/**
 * DisputeResolution enum from TwinkleEscrow
 */
export enum DisputeResolution {
  None = 0,
  Arbitrator = 1,
  Mediation = 2,
}

/**
 * Project struct from TwinkleEscrow
 */
export interface Project {
  freelancer: `0x${string}`;
  client: `0x${string}`;
  token: `0x${string}`;
  status: ProjectStatus;
  disputeResolution: DisputeResolution;
  arbitrator: `0x${string}`;
  totalAmount: bigint;
  fundedAmount: bigint;
  releasedAmount: bigint;
  arbitratorFeePercent: number;
  approvalTimeoutDays: number;
  createdBlock: bigint;
}

/**
 * Milestone struct from TwinkleEscrow
 */
export interface Milestone {
  amount: bigint;
  status: MilestoneStatus;
  streamDurationDays: number;
  streamId: bigint;
  requestedAt: bigint;
}

/**
 * Paywall struct from TwinklePay
 */
export interface Paywall {
  creator: `0x${string}`;
  price: bigint;
  splitContract: `0x${string}`;
  enabled: boolean;
}

/**
 * SubscriptionPlan struct from TwinkleSubscription
 */
export interface SubscriptionPlan {
  creator: `0x${string}`;
  price: bigint;
  intervalDays: number;
  splitContract: `0x${string}`;
  active: boolean;
}

/**
 * Subscription struct from TwinkleSubscription
 */
export interface Subscription {
  planId: `0x${string}`;
  subscriber: `0x${string}`;
  startTime: bigint;
  lastPaidTime: bigint;
  nextDueTime: bigint;
  active: boolean;
}
