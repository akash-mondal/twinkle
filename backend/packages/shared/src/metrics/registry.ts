/**
 * Prometheus Metrics Registry
 * Centralized metrics collection for observability
 */

import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

// Create custom registry
export const registry = new Registry();

// Set default labels
registry.setDefaultLabels({
  app: "twinkle",
});

// Collect default Node.js metrics (memory, cpu, gc, etc.)
collectDefaultMetrics({ register: registry });

/**
 * HTTP Request Metrics
 */
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const httpRequestTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

export const httpRequestsInFlight = new Gauge({
  name: "http_requests_in_flight",
  help: "Current number of HTTP requests being processed",
  labelNames: ["method"],
  registers: [registry],
});

/**
 * Settlement Metrics
 */
export const settlementsTotal = new Counter({
  name: "twinkle_settlements_total",
  help: "Total number of settlements processed",
  labelNames: ["status", "type"],
  registers: [registry],
});

export const settlementDuration = new Histogram({
  name: "twinkle_settlement_duration_seconds",
  help: "Duration of settlement processing in seconds",
  labelNames: ["status"],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [registry],
});

export const settlementAmount = new Histogram({
  name: "twinkle_settlement_amount_mnee",
  help: "Settlement amounts in MNEE",
  labelNames: ["type"],
  buckets: [1, 10, 50, 100, 500, 1000, 5000, 10000],
  registers: [registry],
});

/**
 * RPC Metrics
 */
export const rpcRequestDuration = new Histogram({
  name: "twinkle_rpc_request_duration_seconds",
  help: "Duration of RPC requests in seconds",
  labelNames: ["method", "provider", "status"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const rpcErrorsTotal = new Counter({
  name: "twinkle_rpc_errors_total",
  help: "Total number of RPC errors",
  labelNames: ["method", "provider", "error_type"],
  registers: [registry],
});

/**
 * Transaction Metrics
 */
export const transactionsTotal = new Counter({
  name: "twinkle_transactions_total",
  help: "Total number of transactions submitted",
  labelNames: ["status", "type"],
  registers: [registry],
});

export const transactionRetries = new Counter({
  name: "twinkle_transaction_retries_total",
  help: "Total number of transaction retries",
  labelNames: ["reason"],
  registers: [registry],
});

export const gasUsed = new Histogram({
  name: "twinkle_gas_used",
  help: "Gas used per transaction",
  labelNames: ["type"],
  buckets: [21000, 50000, 100000, 200000, 500000, 1000000],
  registers: [registry],
});

/**
 * Redis Metrics
 */
export const redisOperationDuration = new Histogram({
  name: "twinkle_redis_operation_duration_seconds",
  help: "Duration of Redis operations in seconds",
  labelNames: ["operation"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [registry],
});

/**
 * Queue Metrics (BullMQ)
 */
export const queueJobsTotal = new Counter({
  name: "twinkle_queue_jobs_total",
  help: "Total number of queue jobs",
  labelNames: ["queue", "status"],
  registers: [registry],
});

export const queueJobDuration = new Histogram({
  name: "twinkle_queue_job_duration_seconds",
  help: "Duration of queue job processing",
  labelNames: ["queue"],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [registry],
});

export const queueSize = new Gauge({
  name: "twinkle_queue_size",
  help: "Current size of job queues",
  labelNames: ["queue", "state"],
  registers: [registry],
});

/**
 * Get metrics as Prometheus text format
 */
export async function getMetrics(): Promise<string> {
  return registry.metrics();
}

/**
 * Get metrics as JSON
 */
export async function getMetricsJson(): Promise<object[]> {
  return registry.getMetricsAsJSON();
}
