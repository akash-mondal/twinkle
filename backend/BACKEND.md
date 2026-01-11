# Twinkle Protocol Backend

Complete backend infrastructure for the Twinkle Protocol - a comprehensive payment system for AI agents and content monetization built on Ethereum.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Smart Contract Addresses](#smart-contract-addresses)
- [Services](#services)
  - [Ponder Indexer](#ponder-indexer)
  - [REST API](#rest-api)
  - [x402 Facilitator](#x402-facilitator)
  - [MCP Server](#mcp-server)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [MCP Tools Reference](#mcp-tools-reference)
- [Environment Variables](#environment-variables)
- [Testing](#testing)

---

## Overview

The Twinkle Protocol backend provides:

- **Event Indexing**: Real-time blockchain event indexing with Ponder
- **REST API**: Query indexed data for paywalls, payments, subscriptions, escrow, and splits
- **x402 Facilitator**: EIP-712 signature verification and on-chain settlement for AI agent payments
- **MCP Server**: Model Context Protocol server enabling AI agents (Claude, GPT) to interact with Twinkle

### Key Features

| Feature | Description |
|---------|-------------|
| Paywalls | One-time content unlocks with MNEE payments |
| Subscriptions | Recurring payments with trial periods |
| Escrow | Milestone-based freelancer payments with Sablier streaming |
| Revenue Splits | Automatic distribution to multiple recipients |
| x402 Payments | HTTP 402-based machine-to-machine payments |
| AI Agent Tools | MCP integration for Claude/GPT payment capabilities |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│   Web App   │  AI Agents  │   Claude    │   Mobile    │   CLI   │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────┬────┘
       │             │             │             │           │
       ▼             ▼             ▼             ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                            │
├─────────────┬─────────────┬─────────────┬───────────────────────┤
│  REST API   │ Facilitator │ MCP Server  │      Indexer          │
│  (Hono)     │   (x402)    │  (Claude)   │     (Ponder)          │
│  :3000      │    :3001    │   stdio     │      :42069           │
└──────┬──────┴──────┬──────┴──────┬──────┴──────────┬────────────┘
       │             │             │                 │
       ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        POSTGRESQL                                │
│                    (Ponder Database)                             │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ETHEREUM (SEPOLIA)                             │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ TwinkleCore │ TwinklePay  │TwinkleSub   │TwinkleEscrow│TwinkleX402│
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
```

---

## Project Structure

```
backend/
├── package.json                 # Root workspace configuration
├── pnpm-workspace.yaml          # pnpm workspace definition
├── turbo.json                   # Turborepo build configuration
├── docker-compose.yml           # PostgreSQL + Redis containers
├── .env.example                 # Environment template
├── BACKEND.md                   # This documentation
│
├── packages/
│   └── shared/                  # Shared types, ABIs, constants
│       └── src/
│           ├── abis/            # Contract ABIs (JSON)
│           ├── constants/       # Addresses, chain IDs
│           ├── types/           # TypeScript interfaces
│           └── utils/           # EIP-712 helpers
│
└── apps/
    ├── indexer/                 # Ponder blockchain indexer
    │   ├── ponder.config.ts     # Contract configuration
    │   ├── ponder.schema.ts     # Database schema
    │   ├── abis/                # Contract ABIs
    │   └── src/                 # Event handlers
    │       ├── TwinklePay.ts
    │       ├── TwinkleX402.ts
    │       ├── TwinkleEscrow.ts
    │       ├── TwinkleSubscription.ts
    │       ├── TwinkleSplit.ts
    │       └── TwinkleCore.ts
    │
    ├── api/                     # REST API service
    │   └── src/
    │       ├── index.ts         # Hono app entry
    │       ├── db.ts            # Database connection
    │       └── modules/         # API route modules
    │           ├── payments.ts
    │           ├── paywalls.ts
    │           ├── subscriptions.ts
    │           ├── projects.ts
    │           ├── splits.ts
    │           ├── x402.ts
    │           └── analytics.ts
    │
    ├── facilitator/             # x402 settlement service
    │   └── src/
    │       ├── index.ts         # Hono app entry
    │       └── services/
    │           ├── verification.ts  # EIP-712 verification
    │           ├── settlement.ts    # On-chain settlement
    │           └── mnee-safety.ts   # MNEE blacklist checks
    │
    └── mcp-server/              # MCP server for AI agents
        └── src/
            ├── index.ts         # MCP server entry
            └── tools/
                ├── payment.ts   # Payment tools
                └── subscription.ts # Subscription tools
```

---

## Smart Contract Addresses

### Sepolia Testnet (Chain ID: 11155111)

| Contract | Address | Description |
|----------|---------|-------------|
| TwinkleCore | `0x0DF0E3024350ea0992a7485aDbDE425a79983c09` | Protocol registry, fees, emergency controls |
| TwinklePay | `0xAE1a483ce67a796FcdC7C986CbB556f2975bE190` | Paywalls, direct payments, refunds |
| TwinkleSubscription | `0xa4436C50743FF1eD0C38318A32F502b2A5F899E6` | Subscription plans, renewals |
| TwinkleEscrow | `0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931` | Milestone escrow with Sablier |
| TwinkleSplit | `0x987c621118D66A1F58C032EBdDe8F4f3385B71E4` | Revenue splits |
| TwinkleX402 | `0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3` | HTTP 402 payments |
| TestMNEE | `0xF730d47c3003eCaE2608C452BCD5b0edf825e51C` | Test MNEE token |
| SablierLockup | `0x6b0307b4338f2963A62106028E3B074C2c0510DA` | Sablier streaming |

**Start Block**: `10016000`

---

## Services

### Ponder Indexer

The Ponder indexer syncs blockchain events to PostgreSQL for efficient querying.

**Port**: 42069 (GraphQL)

#### Indexed Events

| Contract | Events |
|----------|--------|
| TwinklePay | PaywallCreated, PaywallUpdated, PaymentReceived, DirectPayment, RefundRequested, RefundApproved, RefundProcessed, RefundRejected |
| TwinkleX402 | PaymentRequestCreated, PaymentRequestCancelled, PaymentSettled, AgentPaymentSettled, ContentAccessGranted, AccessProofRevoked |
| TwinkleSubscription | PlanCreated, PlanUpdated, Subscribed, Renewed, Cancelled, SubscriptionEnded |
| TwinkleEscrow | ProjectCreated, ProjectFunded, MilestoneRequested, MilestoneApproved, MilestoneCompleted, ProjectCompleted, ProjectCancelled, DisputeOpened, DisputeResolved |
| TwinkleSplit | SplitCreated, SplitUpdated, SplitDeactivated, SplitReactivated, FundsReceived, Distributed, Withdrawn |
| TwinkleCore | ProtocolPaused, ProtocolUnpaused, CircuitBreakerActivated, CircuitBreakerDeactivated, FeeCollected, PlatformFeeUpdated, TreasuryUpdated, OperatorUpdated, EmergencyOperatorUpdated, ContractRegistered |

#### Running the Indexer

```bash
# Development mode (with hot reload)
pnpm indexer:dev

# Or from indexer directory
cd apps/indexer
pnpm dev
```

---

### REST API

Hono-based REST API providing read access to indexed blockchain data.

**Port**: 3000

#### Endpoints

##### Health & Info
```
GET /                         # Health check with contract info
GET /health                   # Simple health status
```

##### Payments
```
GET /payments                 # List direct payments
GET /payments/:txHash         # Get payment by transaction hash
```

##### Paywalls
```
GET /paywalls                 # List all paywalls
GET /paywalls/:id             # Get paywall details
GET /paywalls/:id/unlocks     # Get all unlocks for a paywall
GET /paywalls/:id/check/:addr # Check if address has unlocked
```

##### Subscriptions
```
GET /subscriptions/plans      # List subscription plans
GET /subscriptions/plans/:id  # Get plan details
GET /subscriptions/:id        # Get subscription details
GET /subscriptions/user/:addr # Get user's subscriptions
GET /subscriptions/:id/renewals # Get subscription renewals
```

##### Escrow Projects
```
GET /projects                 # List escrow projects
GET /projects/:id             # Get project with milestones
GET /projects/:id/milestones  # Get project milestones
GET /projects/:id/dispute     # Get project dispute
```

##### Splits
```
GET /splits                   # List revenue splits
GET /splits/:id               # Get split details
GET /splits/:id/distributions # Get split distributions
GET /splits/:id/withdrawals   # Get split withdrawals
```

##### x402 Payments
```
GET /x402/requests            # List payment requests
GET /x402/requests/:id        # Get payment request
GET /x402/settlements         # List settlements
GET /x402/agent-payments      # List agent payments
GET /x402/access-proofs/:id   # Verify access proof
```

##### Analytics
```
GET /analytics/overview       # Protocol overview stats
GET /analytics/daily          # Daily stats
GET /analytics/top-creators   # Top creators by revenue
GET /analytics/protocol-events # Recent protocol events
```

#### Running the API

```bash
pnpm api:dev
```

---

### x402 Facilitator

Settlement service for HTTP 402 machine-to-machine payments. Verifies EIP-712 signatures and executes on-chain settlements.

**Port**: 3001

#### Endpoints

```
GET  /                    # Health check
GET  /supported           # Supported networks and assets
POST /verify              # Verify payment payload signature
POST /settle              # Execute settlement on-chain
POST /settle-ap2          # Settlement with agent payment info
GET  /request/:id         # Get payment request details
```

#### EIP-712 Domain

```typescript
const domain = {
  name: 'TwinkleX402',
  version: '2',
  chainId: 11155111n,
  verifyingContract: '0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3',
};

const types = {
  PaymentIntent: [
    { name: 'payer', type: 'address' },
    { name: 'requestId', type: 'bytes32' },
    { name: 'amount', type: 'uint256' },
    { name: 'validUntil', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
};
```

#### Request/Response Examples

**POST /verify**
```json
{
  "paymentPayload": {
    "x402Version": 1,
    "scheme": "exact",
    "network": "eip155:11155111",
    "payload": {
      "signature": "0x...",
      "authorization": {
        "payer": "0x...",
        "requestId": "0x...",
        "amount": "10000000000000000000",
        "validUntil": "1704067200",
        "nonce": "1"
      }
    }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "eip155:11155111",
    "maxAmountRequired": "10000000000000000000",
    "resource": "https://example.com/content",
    "payTo": "0x...",
    "maxTimeoutSeconds": 60,
    "asset": "0xF730d47c3003eCaE2608C452BCD5b0edf825e51C"
  }
}
```

**Response**
```json
{
  "valid": true,
  "payer": "0x...",
  "amount": "10000000000000000000"
}
```

#### Running the Facilitator

```bash
FACILITATOR_PRIVATE_KEY=0x... pnpm facilitator:dev
```

---

### MCP Server

Model Context Protocol server enabling AI agents (Claude, GPT) to interact with Twinkle Protocol.

**Transport**: stdio (for Claude Desktop integration)

#### Available Tools

| Tool | Description |
|------|-------------|
| `twinkle_check_balance` | Check MNEE token balance for an address |
| `twinkle_get_paywall` | Get paywall details including price and status |
| `twinkle_check_unlock` | Check if user has unlocked a paywall |
| `twinkle_create_payment_intent` | Create EIP-712 typed data for signing |
| `twinkle_get_payment_request` | Get x402 payment request details |
| `twinkle_get_plan` | Get subscription plan details |
| `twinkle_check_subscription` | Check if user has active subscription |
| `twinkle_get_subscription` | Get subscription details |

#### Resources

| URI | Description |
|-----|-------------|
| `twinkle://config` | Protocol configuration and contract addresses |

#### Claude Desktop Integration

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "twinkle-payments": {
      "command": "node",
      "args": ["/path/to/backend/apps/mcp-server/dist/index.js"],
      "env": {
        "RPC_URL": "https://ethereum-sepolia.publicnode.com"
      }
    }
  }
}
```

#### Building the MCP Server

```bash
cd apps/mcp-server
pnpm build
```

---

## Database Schema

### Tables

#### TwinklePay Tables

| Table | Description |
|-------|-------------|
| `paywalls` | Paywall configurations |
| `paywall_unlocks` | User unlock records |
| `direct_payments` | Direct peer-to-peer payments |
| `refund_requests` | Refund request records |

#### TwinkleX402 Tables

| Table | Description |
|-------|-------------|
| `payment_requests` | x402 payment requests |
| `x402_settlements` | Settlement records |
| `agent_payments` | AI agent payment metadata |
| `access_proofs` | Access proof records |

#### TwinkleSubscription Tables

| Table | Description |
|-------|-------------|
| `subscription_plans` | Plan configurations |
| `subscriptions` | Active/cancelled subscriptions |
| `subscription_renewals` | Renewal history |

#### TwinkleEscrow Tables

| Table | Description |
|-------|-------------|
| `projects` | Escrow project records |
| `milestones` | Project milestones |
| `disputes` | Dispute records |

#### TwinkleSplit Tables

| Table | Description |
|-------|-------------|
| `splits` | Split configurations |
| `split_distributions` | Distribution records |
| `split_withdrawals` | Withdrawal records |

#### Core Tables

| Table | Description |
|-------|-------------|
| `protocol_events` | Protocol-level events |
| `fee_collections` | Fee collection records |
| `daily_stats` | Aggregated daily statistics |

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker (for PostgreSQL)
- Ethereum RPC endpoint (Sepolia)

### Installation

```bash
# Clone and navigate to backend
cd /path/to/twinkle/backend

# Install dependencies
pnpm install

# Start infrastructure
pnpm docker:up

# Build shared package
pnpm --filter @twinkle/shared build

# Start all services (in separate terminals)
pnpm indexer:dev      # Terminal 1: Indexer
pnpm api:dev          # Terminal 2: REST API
pnpm facilitator:dev  # Terminal 3: Facilitator (with FACILITATOR_PRIVATE_KEY)
```

### Configuration

Create `.env` files in each app directory:

**apps/indexer/.env.local**
```bash
PONDER_RPC_URL_11155111=https://ethereum-sepolia.publicnode.com
DATABASE_URL=postgresql://twinkle:twinkle_dev_password@localhost:5432/twinkle
```

**apps/api/.env**
```bash
DATABASE_URL=postgresql://twinkle:twinkle_dev_password@localhost:5432/twinkle
API_PORT=3000
```

**apps/facilitator/.env**
```bash
RPC_URL=https://ethereum-sepolia.publicnode.com
FACILITATOR_PRIVATE_KEY=0x...
FACILITATOR_PORT=3001
```

---

## API Reference

### Query Parameters

Most list endpoints support:

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Results per page (default: 20, max: 100) |
| `offset` | number | Skip N results |
| `creator` | address | Filter by creator address |
| `user` | address | Filter by user address |
| `from` | timestamp | Filter by start time |
| `to` | timestamp | Filter by end time |

### Response Format

**Success Response**
```json
{
  "data": { ... },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 100,
    "hasMore": true
  }
}
```

**Error Response**
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

---

## MCP Tools Reference

### twinkle_check_balance

Check MNEE token balance for an Ethereum address.

**Input**
```json
{
  "address": "0x61D3bbc2f8fF4f2292ea485Ef9E39560D7DB8465"
}
```

**Output**
```json
{
  "success": true,
  "address": "0x61D3bbc2f8fF4f2292ea485Ef9E39560D7DB8465",
  "balance": "1009761.925",
  "symbol": "tMNEE",
  "raw": "1009761925000000000000000"
}
```

### twinkle_get_paywall

Get details of a Twinkle paywall.

**Input**
```json
{
  "paywallId": "0x2eaf7cc67d979d2047115587711aa2bb58de78378b6ddb9b6c11532844cb12a9"
}
```

**Output**
```json
{
  "success": true,
  "paywallId": "0x...",
  "exists": true,
  "creator": "0x61D3bbc2f8fF4f2292ea485Ef9E39560D7DB8465",
  "price": "10",
  "splitAddress": "0x0000000000000000000000000000000000000000",
  "totalUnlocks": 1,
  "totalRevenue": "10",
  "active": true,
  "x402Enabled": true
}
```

### twinkle_create_payment_intent

Create EIP-712 typed data for a payment intent.

**Input**
```json
{
  "payerAddress": "0x...",
  "recipientAddress": "0x...",
  "amount": "10.5",
  "paywallId": "0x..." // optional
}
```

**Output**
```json
{
  "success": true,
  "action": "sign_payment_intent",
  "intentData": {
    "payer": "0x...",
    "requestId": "0x...",
    "amount": "10500000000000000000",
    "validUntil": "1704070800",
    "nonce": "1704067200000"
  },
  "domain": {
    "name": "TwinkleX402",
    "version": "2",
    "chainId": 11155111,
    "verifyingContract": "0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3"
  },
  "types": {
    "PaymentIntent": [...]
  },
  "message": "Sign to authorize payment of 10.5 MNEE to 0x..."
}
```

---

## Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `PONDER_RPC_URL_11155111` | Indexer | Sepolia RPC endpoint |
| `DATABASE_URL` | Indexer, API | PostgreSQL connection string |
| `RPC_URL` | Facilitator, MCP | Ethereum RPC endpoint |
| `FACILITATOR_PRIVATE_KEY` | Facilitator | Private key for settlement |
| `FACILITATOR_PORT` | Facilitator | Server port (default: 3001) |
| `API_PORT` | API | Server port (default: 3000) |

---

## Testing

### Run E2E Tests

```bash
# Full end-to-end test suite
pnpm test:e2e

# API endpoint tests
pnpm test:api

# x402 settlement test
pnpm test:x402
```

### Manual Testing

**Test Balance Check (MCP)**
```bash
cd apps/mcp-server
RPC_URL=https://ethereum-sepolia.publicnode.com node dist/index.js
```

**Test API Endpoints**
```bash
# Health check
curl http://localhost:3000/

# List paywalls
curl http://localhost:3000/paywalls

# Get specific paywall
curl http://localhost:3000/paywalls/0x2eaf7cc67d979d2047115587711aa2bb58de78378b6ddb9b6c11532844cb12a9
```

**Test Facilitator**
```bash
# Check supported networks
curl http://localhost:3001/supported

# Get payment request
curl http://localhost:3001/request/0x...
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Package Manager | pnpm 9+ |
| Build System | Turborepo |
| Indexer | Ponder |
| REST Framework | Hono |
| Database | PostgreSQL |
| Blockchain | viem |
| MCP | @modelcontextprotocol/sdk |
| Validation | Zod |
| TypeScript | 5.4+ |

---

## License

MIT
