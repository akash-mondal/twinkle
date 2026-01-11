# Monitoring Guide

Comprehensive monitoring, logging, and observability setup for Twinkle backend.

## Overview

The Twinkle backend includes:
- **Prometheus Metrics**: HTTP request metrics, custom business metrics
- **Structured Logging**: JSON logs via Pino
- **Error Tracking**: Sentry integration
- **Distributed Tracing**: OpenTelemetry support

---

## Prometheus Metrics

### Endpoints

| Service | Endpoint | Port |
|---------|----------|------|
| API | `/metrics` | 3000 |
| Facilitator | `/metrics` | 3001 |

### Available Metrics

#### HTTP Metrics (API & Facilitator)

```prometheus
# Request duration histogram
http_request_duration_seconds{method,route,status_code}

# Total request counter
http_requests_total{method,route,status_code}
```

**Labels**:
- `method`: HTTP method (GET, POST, etc.)
- `route`: URL route pattern
- `status_code`: HTTP status code

#### Settlement Metrics (Facilitator)

```prometheus
# Settlement operations counter
twinkle_settlements_total{status,type}

# Settlement duration histogram
twinkle_settlement_duration_seconds{status}
```

**Labels**:
- `status`: success, failure, pending
- `type`: paywall, subscription, direct

#### Node.js Metrics

Default Node.js metrics are automatically collected:

```prometheus
# CPU usage
process_cpu_user_seconds_total
process_cpu_system_seconds_total

# Memory usage
process_resident_memory_bytes
process_heap_bytes

# Event loop
nodejs_eventloop_lag_seconds

# Active handles/requests
nodejs_active_handles_total
nodejs_active_requests_total
```

### Scrape Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'twinkle-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'twinkle-facilitator'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

---

## Grafana Dashboards

### API Dashboard

Create dashboard with these panels:

#### Request Rate
```promql
sum(rate(http_requests_total{job="twinkle-api"}[5m])) by (route)
```

#### Error Rate
```promql
sum(rate(http_requests_total{job="twinkle-api",status_code=~"5.."}[5m])) /
sum(rate(http_requests_total{job="twinkle-api"}[5m])) * 100
```

#### Request Latency (P95)
```promql
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{job="twinkle-api"}[5m])) by (le, route)
)
```

#### Requests by Status Code
```promql
sum(rate(http_requests_total{job="twinkle-api"}[5m])) by (status_code)
```

### Facilitator Dashboard

#### Settlement Success Rate
```promql
sum(rate(twinkle_settlements_total{status="success"}[5m])) /
sum(rate(twinkle_settlements_total[5m])) * 100
```

#### Settlement Duration (P95)
```promql
histogram_quantile(0.95,
  sum(rate(twinkle_settlement_duration_seconds_bucket[5m])) by (le)
)
```

#### Settlements by Type
```promql
sum(rate(twinkle_settlements_total[5m])) by (type)
```

---

## Structured Logging

### Log Format

All services use Pino for JSON structured logging:

```json
{
  "level": 30,
  "time": 1704931200000,
  "pid": 12345,
  "hostname": "server-1",
  "service": "api",
  "reqId": "abc-123",
  "msg": "Request completed",
  "method": "GET",
  "path": "/payments",
  "status": 200,
  "duration": 0.045
}
```

### Log Levels

| Level | Value | Usage |
|-------|-------|-------|
| `trace` | 10 | Fine-grained debugging |
| `debug` | 20 | Debugging information |
| `info` | 30 | Normal operations |
| `warn` | 40 | Warning conditions |
| `error` | 50 | Error conditions |
| `fatal` | 60 | Application cannot continue |

### Configuration

Set via environment:

```bash
# Development (verbose)
LOG_LEVEL=debug

# Production (normal)
LOG_LEVEL=info

# MCP Server (quiet - uses stdout for protocol)
LOG_LEVEL=warn
```

### Pretty Printing (Development)

In development, logs are pretty-printed:

```bash
pnpm --filter @twinkle/api dev | pnpm pino-pretty
```

### Log Aggregation

Ship logs to centralized system:

#### Loki (Grafana)
```yaml
# promtail config
scrape_configs:
  - job_name: twinkle
    static_configs:
      - targets:
          - localhost
        labels:
          job: twinkle
          __path__: /var/log/twinkle/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            service: service
            reqId: reqId
```

#### Elasticsearch
```bash
# Using pino-elasticsearch
node apps/api/dist/index.js | pino-elasticsearch --index twinkle-logs
```

---

## Error Tracking (Sentry)

### Configuration

```bash
SENTRY_DSN=https://abc123@o1234567.ingest.sentry.io/5678901
```

### Automatic Capture

Errors are automatically captured:
- Uncaught exceptions
- Unhandled promise rejections
- HTTP 5xx errors
- Settlement failures

### Manual Capture

```typescript
import { captureError } from "@twinkle/shared";

try {
  // risky operation
} catch (error) {
  captureError(error, {
    tool: "settlement",
    requestId: "0x...",
  });
}
```

### Sensitive Data Scrubbing

The following are automatically scrubbed:
- Private keys
- Authorization headers
- Request bodies with sensitive fields
- RPC URLs (API keys removed)

---

## Distributed Tracing (OpenTelemetry)

### Configuration

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_SERVICE_NAME=twinkle-api
```

### Trace Context

Traces include:
- HTTP request spans
- Database query spans
- Redis operation spans
- RPC call spans

### Jaeger Setup

```yaml
# docker-compose for Jaeger
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "4318:4318"    # OTLP HTTP
```

### Viewing Traces

1. Open Jaeger UI: http://localhost:16686
2. Select service: `twinkle-api` or `twinkle-facilitator`
3. Search for traces by request ID

---

## Health Checks

### Endpoints

| Service | Endpoint | Checks |
|---------|----------|--------|
| API | `/health` | Redis, Database |
| Facilitator | `/health` | Redis, RPC |

### Response Format

```json
{
  "status": "healthy",
  "timestamp": "2024-01-11T10:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "redis": {
      "status": "ok",
      "latency": 1
    },
    "database": {
      "status": "ok",
      "latency": 5
    }
  },
  "service": "api"
}
```

### Status Codes

- `200`: All dependencies healthy
- `503`: One or more dependencies unhealthy

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## Alerting Rules

### Prometheus Alert Rules

```yaml
groups:
  - name: twinkle-alerts
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # High latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ $value }}s"

      # Settlement failures
      - alert: SettlementFailures
        expr: |
          sum(rate(twinkle_settlements_total{status="failure"}[5m])) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Settlement failures detected"

      # Service down
      - alert: ServiceDown
        expr: up{job=~"twinkle.*"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.job }} is down"
```

---

## Rate Limiting Monitoring

### Metrics

Rate limiting uses Redis. Monitor via Redis metrics:

```bash
# Check current rate limit state
redis-cli KEYS "api:ratelimit:*" | head -10
redis-cli GET "api:ratelimit:192.168.1.1"
```

### Headers

API responses include rate limit headers:

```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 195
X-RateLimit-Reset: 1704931260
```

### Alerts

```yaml
- alert: HighRateLimitHits
  expr: |
    sum(rate(http_requests_total{status_code="429"}[5m])) > 10
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High rate of rate-limited requests"
```

---

## Debug Commands

### Check Service Health

```bash
# API
curl -s http://localhost:3000/health | jq

# Facilitator
curl -s http://localhost:3001/health | jq
```

### View Metrics

```bash
# All metrics
curl -s http://localhost:3000/metrics

# Specific metric
curl -s http://localhost:3000/metrics | grep http_request_duration
```

### Check Redis

```bash
# Connection test
redis-cli ping

# Rate limit keys
redis-cli KEYS "*ratelimit*"

# Nonce manager keys
redis-cli KEYS "*nonce*"
```

### Check Logs

```bash
# Real-time logs (if running via PM2)
pm2 logs twinkle-api --lines 100

# Pretty print JSON logs
cat /var/log/twinkle/api.log | pnpm pino-pretty
```
