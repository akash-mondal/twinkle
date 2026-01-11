# Twinkle REST API Reference

Complete API reference for the Twinkle REST API.

**Base URL**: `http://localhost:3000` (development)

## Overview

The API provides read-only access to indexed blockchain data. All data is synced from Sepolia smart contracts via the indexer service.

### Response Format

All responses are JSON with this structure:

```json
{
  "data": [...],           // Array for list endpoints
  "pagination": {          // For paginated endpoints
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "requestId": "uuid-v4"
}
```

### Rate Limiting

- **Limit**: 200 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets
- **429 Response**: Rate limit exceeded

---

## System Endpoints

### GET /

Service information and health status.

**Response**:
```json
{
  "service": "twinkle-api",
  "version": "1.0.0",
  "status": "healthy",
  "database": "connected",
  "chainId": 11155111,
  "contracts": {
    "TwinkleCore": "0x0DF0E3024350ea0992a7485aDbDE425a79983c09",
    "TwinklePay": "0xAE1a483ce67a796FcdC7C986CbB556f2975bE190",
    "TwinkleSubscription": "0xa4436C50743FF1eD0C38318A32F502b2A5F899E6",
    "TwinkleEscrow": "0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931",
    "TwinkleSplit": "0x987c621118D66A1F58C032EBdDe8F4f3385B71E4",
    "TwinkleX402": "0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3"
  }
}
```

### GET /health

Detailed health check with dependency status.

**Response**:
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

**Status Codes**:
- `200`: All dependencies healthy
- `503`: One or more dependencies unhealthy

### GET /metrics

Prometheus metrics endpoint.

**Response**: Prometheus text format

```
# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/payments",status_code="200",le="0.005"} 10
...
```

---

## Payments Module

### GET /payments

List direct MNEE payments.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default: 20, max: 100) |
| `offset` | number | Skip results (default: 0) |
| `from` | address | Filter by sender address |
| `to` | address | Filter by recipient address |

**Example**:
```bash
curl "http://localhost:3000/payments?limit=10&from=0x742d35Cc6634C0532925a3b844Bc9e7595f..."
```

**Response**:
```json
{
  "data": [
    {
      "id": "0x...",
      "txHash": "0x...",
      "from": "0x...",
      "to": "0x...",
      "amount": "1000000000000000000",
      "amountFormatted": "1.0",
      "timestamp": "2024-01-11T10:00:00.000Z",
      "blockNumber": 10016500
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET /payments/:txHash

Get payment by transaction hash.

**Example**:
```bash
curl "http://localhost:3000/payments/0x123..."
```

**Response**:
```json
{
  "id": "0x...",
  "txHash": "0x123...",
  "from": "0x...",
  "to": "0x...",
  "amount": "1000000000000000000",
  "amountFormatted": "1.0",
  "timestamp": "2024-01-11T10:00:00.000Z",
  "blockNumber": 10016500
}
```

---

## Paywalls Module

### GET /paywalls

List all paywalls.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default: 20) |
| `offset` | number | Skip results |
| `active` | boolean | Filter by active status |
| `creator` | address | Filter by creator address |

**Example**:
```bash
curl "http://localhost:3000/paywalls?active=true&limit=10"
```

**Response**:
```json
{
  "data": [
    {
      "id": "0x...",
      "creator": "0x...",
      "price": "1000000000000000000",
      "priceFormatted": "1.0",
      "splitAddress": "0x...",
      "totalUnlocks": 50,
      "totalRevenue": "50000000000000000000",
      "totalRevenueFormatted": "50.0",
      "active": true,
      "x402Enabled": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### GET /paywalls/:id

Get paywall details by ID.

**Example**:
```bash
curl "http://localhost:3000/paywalls/0x1234567890abcdef..."
```

### GET /paywalls/:id/unlocks

Get all unlocks for a paywall.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results |
| `offset` | number | Skip results |

**Response**:
```json
{
  "data": [
    {
      "id": "0x...",
      "paywallId": "0x...",
      "user": "0x...",
      "amount": "1000000000000000000",
      "txHash": "0x...",
      "timestamp": "2024-01-11T10:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### GET /paywalls/:id/check/:address

Check if a user has unlocked a paywall.

**Example**:
```bash
curl "http://localhost:3000/paywalls/0x.../check/0x742d35Cc..."
```

**Response**:
```json
{
  "paywallId": "0x...",
  "address": "0x...",
  "unlocked": true,
  "unlockedAt": "2024-01-11T10:00:00.000Z"
}
```

---

## Subscriptions Module

### GET /subscriptions/plans

List subscription plans.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results |
| `offset` | number | Skip results |
| `active` | boolean | Filter by active status |
| `creator` | address | Filter by creator |

**Response**:
```json
{
  "data": [
    {
      "id": "0x...",
      "creator": "0x...",
      "price": "10000000000000000000",
      "priceFormatted": "10.0",
      "intervalDays": 30,
      "trialDays": 7,
      "subscriberCount": 100,
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### GET /subscriptions/plans/:id

Get plan details by ID.

### GET /subscriptions/:id

Get subscription details by subscription ID.

**Response**:
```json
{
  "id": "0x...",
  "planId": "0x...",
  "subscriber": "0x...",
  "startedAt": "2024-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
  "active": true,
  "cancelled": false
}
```

### GET /subscriptions/user/:address

Get all subscriptions for a user.

**Response**:
```json
{
  "data": [
    {
      "id": "0x...",
      "planId": "0x...",
      "startedAt": "2024-01-01T00:00:00.000Z",
      "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
      "active": true,
      "plan": {
        "price": "10.0",
        "intervalDays": 30
      }
    }
  ]
}
```

### GET /subscriptions/:id/renewals

Get renewal history for a subscription.

---

## Projects (Escrow) Module

### GET /projects

List escrow projects.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | number | Filter by status (0=Created, 1=Funded, 2=InProgress, 3=Completed, 4=Disputed, 5=Cancelled) |
| `client` | address | Filter by client address |
| `freelancer` | address | Filter by freelancer address |

**Response**:
```json
{
  "data": [
    {
      "id": "0x...",
      "client": "0x...",
      "freelancer": "0x...",
      "arbiter": "0x...",
      "totalAmount": "100000000000000000000",
      "totalAmountFormatted": "100.0",
      "releasedAmount": "50000000000000000000",
      "status": 2,
      "statusName": "InProgress",
      "milestoneCount": 4,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### GET /projects/:id

Get project with all milestones.

### GET /projects/:id/milestones

Get project milestones only.

**Response**:
```json
{
  "data": [
    {
      "id": "0x...",
      "projectId": "0x...",
      "index": 0,
      "amount": "25000000000000000000",
      "description": "Phase 1 - Design",
      "status": 2,
      "statusName": "Completed",
      "completedAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

### GET /projects/:id/dispute

Get dispute details if project is disputed.

---

## Splits Module

### GET /splits

List payment splits.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `active` | boolean | Filter by active status |
| `creator` | address | Filter by creator |

**Response**:
```json
{
  "data": [
    {
      "id": "0x...",
      "creator": "0x...",
      "name": "Team Revenue Split",
      "totalDistributed": "1000000000000000000000",
      "active": true,
      "recipients": [
        {
          "address": "0x...",
          "share": 5000,
          "sharePercent": 50.0
        },
        {
          "address": "0x...",
          "share": 3000,
          "sharePercent": 30.0
        }
      ]
    }
  ],
  "pagination": {...}
}
```

### GET /splits/:id

Get split details with recipients.

### GET /splits/:id/distributions

Get distribution history for a split.

### GET /splits/:id/withdrawals

Get withdrawal history for a split.

---

## X402 Module

Payment request and settlement endpoints for x402 protocol.

### GET /x402/requests

List payment requests.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `settled` | boolean | Filter by settlement status |
| `payTo` | address | Filter by recipient |
| `limit` | number | Max results |

**Response**:
```json
{
  "data": [
    {
      "id": "0x...",
      "payTo": "0x...",
      "amount": "1000000000000000000",
      "amountFormatted": "1.0",
      "paywallId": "0x...",
      "validUntil": "2024-01-12T00:00:00.000Z",
      "settled": false,
      "createdAt": "2024-01-11T10:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### GET /x402/requests/:id

Get payment request by ID.

### GET /x402/settlements

List payment settlements.

**Response**:
```json
{
  "data": [
    {
      "id": "0x...",
      "requestId": "0x...",
      "payer": "0x...",
      "amount": "1000000000000000000",
      "txHash": "0x...",
      "accessProofId": "0x...",
      "timestamp": "2024-01-11T10:30:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### GET /x402/agent-payments

List Agent Protocol 2 (AP2) payments.

### GET /x402/access-proofs/:id

Verify an access proof.

**Response**:
```json
{
  "id": "0x...",
  "paywallId": "0x...",
  "user": "0x...",
  "valid": true,
  "expiresAt": "2024-01-18T10:30:00.000Z"
}
```

---

## Analytics Module

### GET /analytics/overview

Get protocol overview statistics.

**Response**:
```json
{
  "totalPayments": 10000,
  "totalVolume": "1000000000000000000000000",
  "totalVolumeFormatted": "1,000,000.0",
  "activePaywalls": 500,
  "activeSubscriptions": 200,
  "activeProjects": 50,
  "uniqueUsers": 5000
}
```

### GET /analytics/daily

Get daily statistics.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `days` | number | Number of days (default: 30, max: 90) |

**Response**:
```json
{
  "data": [
    {
      "date": "2024-01-11",
      "payments": 100,
      "volume": "10000000000000000000000",
      "volumeFormatted": "10,000.0",
      "newUsers": 50,
      "newPaywalls": 5
    }
  ]
}
```

### GET /analytics/top-creators

Get top creators by revenue.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default: 10) |

**Response**:
```json
{
  "data": [
    {
      "address": "0x...",
      "totalRevenue": "100000000000000000000000",
      "totalRevenueFormatted": "100,000.0",
      "paywallCount": 10,
      "subscriptionCount": 5,
      "totalUnlocks": 1000
    }
  ]
}
```

### GET /analytics/protocol-events

Get recent protocol events.

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Dependencies unhealthy |
