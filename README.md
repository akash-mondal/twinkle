# Twinkle

A payment platform for AI agents and content monetization built on Ethereum. Implements the [x402 payment protocol](https://x402.org) for machine-to-machine transactions using MNEE stablecoin.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Smart Contracts](#smart-contracts)
- [Backend Services](#backend-services)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Testing](#testing)
- [API Reference](#api-reference)
- [MCP Server](#mcp-server)
- [x402 Protocol](#x402-protocol)
- [Contract Addresses](#contract-addresses)
- [License](#license)

---

## Overview

Twinkle provides:

- **AI Agent Payments**: Autonomous payments via the x402 HTTP payment protocol
- **Content Paywalls**: One-time content unlocks with configurable pricing
- **Subscriptions**: Recurring payment plans with grace periods
- **Revenue Splits**: Automatic distribution to multiple recipients
- **Milestone Escrow**: Freelance payments with Sablier streaming integration

```mermaid
graph TB
    subgraph "Client Layer"
        AI[AI Agents]
        Web[Web Apps]
        Mobile[Mobile Apps]
    end

    subgraph "Backend Services"
        API[REST API]
        Facilitator[x402 Facilitator]
        MCP[MCP Server]
        Indexer[Ponder Indexer]
    end

    subgraph "Infrastructure"
        Redis[(Redis)]
        Postgres[(PostgreSQL)]
    end

    subgraph "Blockchain"
        Contracts[Smart Contracts]
        MNEE[MNEE Token]
    end

    AI --> MCP
    AI --> Facilitator
    Web --> API
    Mobile --> API

    API --> Postgres
    API --> Redis
    Facilitator --> Contracts
    Indexer --> Contracts
    Indexer --> Postgres
    MCP --> API
    MCP --> Contracts

    Contracts --> MNEE
```

---

## Architecture

### System Components

```mermaid
graph LR
    subgraph "Smart Contracts"
        Core[TwinkleCore]
        Pay[TwinklePay]
        X402[TwinkleX402]
        Sub[TwinkleSubscription]
        Escrow[TwinkleEscrow]
        Split[TwinkleSplit]
    end

    subgraph "Backend"
        API[REST API :3000]
        Fac[Facilitator :3001]
        MCP[MCP Server :3002]
        Idx[Indexer]
    end

    Core --> Pay
    Core --> X402
    Core --> Sub
    Core --> Escrow
    Core --> Split

    Idx --> API
    Fac --> X402
    MCP --> API
```

### Directory Structure

```
twinkle/
├── contracts/                 # Solidity smart contracts (Foundry)
│   ├── src/
│   │   ├── twinkle/          # Core protocol contracts
│   │   ├── interfaces/       # Contract interfaces
│   │   └── test-mnee/        # Test token implementation
│   ├── script/               # Deployment scripts
│   ├── test/                 # Contract tests
│   └── lib/                  # Dependencies (forge-std, OpenZeppelin)
│
└── backend/                   # Backend services (TypeScript)
    ├── apps/
    │   ├── api/              # REST API server
    │   ├── facilitator/      # x402 settlement service
    │   ├── indexer/          # Ponder blockchain indexer
    │   ├── mcp-server/       # MCP server for AI agents
    │   └── worker/           # Background job processor
    ├── packages/
    │   └── shared/           # Shared types, ABIs, utilities
    └── scripts/
        └── demos/            # Demo scripts
```

---

## Features

### Paywalls

One-time content unlocks with MNEE token payments.

```mermaid
sequenceDiagram
    participant Creator
    participant TwinklePay
    participant User

    Creator->>TwinklePay: createPaywall(contentId, price)
    TwinklePay-->>Creator: paywallId

    User->>TwinklePay: pay(paywallId)
    TwinklePay->>TwinklePay: Transfer MNEE
    TwinklePay-->>User: AccessGranted event

    User->>TwinklePay: isUnlocked(paywallId, user)
    TwinklePay-->>User: true
```

**Features:**
- Custom pricing per content
- Optional revenue splits for collaborations
- x402 protocol support for AI agents
- Refund capability (creator-initiated)

### x402 AI Agent Payments

HTTP 402-based payment protocol enabling AI agents to autonomously pay for resources.

```mermaid
sequenceDiagram
    participant Agent as AI Agent
    participant Server as Content Server
    participant Facilitator
    participant TwinkleX402

    Agent->>Server: GET /premium-content
    Server-->>Agent: 402 Payment Required<br/>X-Payment-Amount: 10 MNEE

    Agent->>Agent: Sign EIP-712 PaymentIntent
    Agent->>Server: GET /premium-content<br/>X-PAYMENT: base64(signed)

    Server->>Facilitator: Verify signature
    Facilitator->>TwinkleX402: settle(intent, signature)
    TwinkleX402-->>Facilitator: AccessProof

    Facilitator-->>Server: Valid, accessProofId
    Server-->>Agent: 200 OK + Content
```

**Features:**
- EIP-712 typed data signing
- Off-chain authorization (no gas for payers)
- Facilitator-based settlement
- Access proof verification
- Platform fee collection

### Subscriptions

Recurring payment plans with automatic renewal tracking.

**Features:**
- Configurable payment intervals
- Grace periods for late payments
- Trial period support
- Automatic expiration tracking

### Revenue Splits

Automatic distribution of payments to multiple recipients.

```mermaid
graph LR
    A[Payment] --> B[Split Contract]
    B --> C[Recipient 1: 50%]
    B --> D[Recipient 2: 30%]
    B --> E[Recipient 3: 20%]
```

**Features:**
- Up to 10 recipients per split
- Percentage-based shares (basis points)
- Integration with paywalls
- Withdrawal at any time

### Milestone Escrow

Freelance project payments with milestone-based releases.

```mermaid
stateDiagram-v2
    [*] --> Created: createProject()
    Created --> Funded: fund()
    Funded --> Active: freelancer accepts
    Active --> MilestoneComplete: completeMilestone()
    MilestoneComplete --> Active: more milestones
    MilestoneComplete --> Completed: all done
    Active --> Disputed: dispute()
    Disputed --> Resolved: resolve()
```

**Features:**
- Milestone-based fund release
- Client approval workflow
- Sablier streaming integration
- Dispute resolution mechanism

---

## Smart Contracts

### Contract Overview

| Contract | Description |
|----------|-------------|
| TwinkleCore | Protocol configuration, fee management, emergency controls |
| TwinklePay | Paywall creation, payments, refunds |
| TwinkleX402 | x402 protocol settlement, access proofs |
| TwinkleSubscription | Subscription plans, renewals |
| TwinkleEscrow | Freelance escrow, milestones, streaming |
| TwinkleSplit | Revenue distribution |
| TestMNEE | Test stablecoin (Sepolia only) |

### Contract Interactions

```mermaid
graph TD
    Core[TwinkleCore]
    Pay[TwinklePay]
    X402[TwinkleX402]
    Sub[TwinkleSubscription]
    Escrow[TwinkleEscrow]
    Split[TwinkleSplit]
    MNEE[MNEE Token]
    Sablier[Sablier Lockup]

    Pay --> Core
    Pay --> MNEE
    Pay --> Split

    X402 --> Core
    X402 --> Pay
    X402 --> MNEE

    Sub --> Core
    Sub --> MNEE

    Escrow --> Core
    Escrow --> MNEE
    Escrow --> Sablier

    Split --> Core
    Split --> MNEE
```

---

## Backend Services

### REST API

Full-featured REST API for querying indexed blockchain data.

**Endpoints:**
- `GET /health` - Health check with dependency status
- `GET /paywalls` - List paywalls with filtering
- `GET /paywalls/:id` - Get paywall details
- `GET /paywalls/:id/check/:address` - Check unlock status
- `GET /subscriptions/plans` - List subscription plans
- `GET /subscriptions/user/:address` - Get user subscriptions
- `GET /projects` - List escrow projects
- `GET /splits` - List revenue splits
- `GET /payments` - List payments
- `GET /analytics/overview` - Protocol analytics

### x402 Facilitator

Settlement service for x402 payments.

**Endpoints:**
- `POST /verify` - Verify EIP-712 signature
- `POST /settle` - Execute on-chain settlement
- `GET /settlement/:requestId` - Get settlement status

### Ponder Indexer

Real-time blockchain event indexing using Ponder.

**Indexed Events:**
- PaywallCreated, PaywallUnlocked, PaywallRefunded
- PaymentRequestCreated, PaymentSettled, AccessProofCreated
- PlanCreated, Subscribed, Renewed, Cancelled
- ProjectCreated, MilestoneCompleted, FundsReleased
- SplitCreated, FundsDeposited, FundsDistributed

### MCP Server

Model Context Protocol server for AI agent integration.

**Tools:**
- `twinkle_check_balance` - Check MNEE balance
- `twinkle_get_paywall` - Get paywall details
- `twinkle_check_unlock` - Verify content access
- `twinkle_create_payment_intent` - Generate EIP-712 data
- `twinkle_get_payment_request` - Get payment request
- `twinkle_get_plan` - Get subscription plan
- `twinkle_check_subscription` - Check subscription status
- `twinkle_get_subscription` - Get subscription details

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose
- Foundry (for contracts)

### Clone Repository

```bash
git clone https://github.com/yourusername/twinkle.git
cd twinkle
```

### Smart Contracts Setup

```bash
cd contracts

# Install dependencies
forge install

# Copy environment file
cp .env.example .env
# Edit .env with your RPC URL and private key

# Build contracts
forge build

# Run tests
forge test

# Deploy to Sepolia
forge script script/DeployTwinkle.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

### Backend Setup

```bash
cd backend

# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Build shared package
pnpm --filter @twinkle/shared build

# Start all services in development mode
pnpm dev
```

### Service Ports

| Service | Port |
|---------|------|
| REST API | 3000 |
| Facilitator | 3001 |
| MCP Server | 3002 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## Configuration

### Backend Environment Variables

```bash
# Database
DATABASE_URL=postgresql://twinkle:password@localhost:5432/twinkle
PONDER_DATABASE_URL=postgresql://twinkle:password@localhost:5432/twinkle

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain RPC
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Facilitator
FACILITATOR_PRIVATE_KEY=0x...  # Must be registered on TwinkleX402
FACILITATOR_PORT=3001

# API
API_PORT=3000

# Indexer
START_BLOCK=10016000
CHAIN_ID=11155111

# Logging
LOG_LEVEL=debug
NODE_ENV=development
```

### Contracts Environment Variables

```bash
# Deployer
PRIVATE_KEY=0x...

# RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETH_RPC_URL=https://ethereum.publicnode.com

# Verification
ETHERSCAN_API_KEY=your_key
```

---

## Testing

### Smart Contract Tests

```bash
cd contracts

# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testSettlePayment

# Run with gas report
forge test --gas-report

# Run fork tests
forge test --fork-url $ETH_RPC_URL --match-contract MainnetMNEEFork
```

### Backend Tests

```bash
cd backend

# Build packages
pnpm build

# Run API tests
./scripts/test-api.sh

# Run health checks
./scripts/test-health.sh

# Run end-to-end tests
./scripts/test-e2e.sh
```

### Demo Scripts

```bash
cd backend/scripts/demos

# Set environment variables
export RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
export TEST_PRIVATE_KEY=0x...

# Run demos
npx tsx demo-api-queries.ts      # Query all API endpoints
npx tsx demo-x402-agent.ts       # Full x402 payment flow
npx tsx demo-paywall-flow.ts     # Paywall lifecycle
npx tsx demo-subscription.ts     # Subscription workflow
npx tsx demo-escrow.ts           # Escrow milestone flow
npx tsx demo-split.ts            # Revenue distribution
npx tsx demo-mcp-tools.ts        # MCP tool testing
npx tsx demo-full-workflow.ts    # Complete demonstration
```

---

## API Reference

### Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "checks": {
    "redis": { "status": "healthy" },
    "database": { "status": "healthy" }
  }
}
```

### Paywalls

```bash
# List paywalls
GET /paywalls?creator=0x...&active=true&limit=10&offset=0

# Get paywall
GET /paywalls/:id

# Check unlock
GET /paywalls/:id/check/:address
```

### Subscriptions

```bash
# List plans
GET /subscriptions/plans?creator=0x...&active=true

# Get plan
GET /subscriptions/plans/:id

# Check subscription
GET /subscriptions/plans/:id/check/:address

# User subscriptions
GET /subscriptions/user/:address
```

### Projects (Escrow)

```bash
# List projects
GET /projects?client=0x...&freelancer=0x...&status=active

# Get project
GET /projects/:id
```

### Splits

```bash
# List splits
GET /splits?creator=0x...

# Get split
GET /splits/:id
```

### Analytics

```bash
# Overview
GET /analytics/overview

# Daily metrics
GET /analytics/daily?startDate=2024-01-01&endDate=2024-01-31
```

---

## MCP Server

### Configuration

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "twinkle": {
      "command": "node",
      "args": ["/path/to/backend/apps/mcp-server/dist/index.js"],
      "env": {
        "RPC_URL": "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY",
        "API_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Tool Usage

```typescript
// Check balance
twinkle_check_balance({ address: "0x..." })

// Get paywall info
twinkle_get_paywall({ paywallId: "0x..." })

// Create payment intent
twinkle_create_payment_intent({
  payer: "0x...",
  requestId: "0x...",
  amount: "1000000000000000000",
  validFor: 3600
})
```

---

## x402 Protocol

### Payment Flow

1. **Request Resource**: Agent requests protected content
2. **402 Response**: Server returns payment requirements in headers
3. **Sign Intent**: Agent signs EIP-712 PaymentIntent
4. **Retry with Payment**: Agent retries with X-PAYMENT header
5. **Settle**: Facilitator settles on-chain
6. **Verify**: Server verifies access proof
7. **Deliver**: Content delivered to agent

### Headers

**402 Response Headers:**
```
X-Payment-Amount: 1000000000000000000
X-Payment-Asset: 0xF730d47c3003eCaE2608C452BCD5b0edf825e51C
X-Payment-PayTo: 0x...
X-Payment-RequestId: 0x...
X-Payment-ValidUntil: 1704067200
```

**Payment Header:**
```
X-PAYMENT: base64({
  intent: { payer, requestId, amount, validUntil, nonce },
  signature: "0x..."
})
```

### EIP-712 Domain

```typescript
{
  name: "TwinkleX402",
  version: "2",
  chainId: 11155111,
  verifyingContract: "0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3"
}
```

### PaymentIntent Type

```typescript
{
  PaymentIntent: [
    { name: "payer", type: "address" },
    { name: "requestId", type: "bytes32" },
    { name: "amount", type: "uint256" },
    { name: "validUntil", type: "uint256" },
    { name: "nonce", type: "uint256" }
  ]
}
```

---

## Contract Addresses

### Sepolia Testnet (Chain ID: 11155111)

| Contract | Address |
|----------|---------|
| TwinkleCore | `0x0DF0E3024350ea0992a7485aDbDE425a79983c09` |
| TwinklePay | `0xAE1a483ce67a796FcdC7C986CbB556f2975bE190` |
| TwinkleX402 | `0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3` |
| TwinkleSubscription | `0xa4436C50743FF1eD0C38318A32F502b2A5F899E6` |
| TwinkleEscrow | `0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931` |
| TwinkleSplit | `0x987c621118D66A1F58C032EBdDe8F4f3385B71E4` |
| TestMNEE (Proxy) | `0xF730d47c3003eCaE2608C452BCD5b0edf825e51C` |
| Sablier Lockup | `0x6b0307b4338f2963A62106028E3B074C2c0510DA` |

### Ethereum Mainnet

| Contract | Address |
|----------|---------|
| MNEE Token | `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF` |
| Sablier Lockup | `0x3962f6585946823440d274aD7C719B02b49DE51E` |

---

## External Dependencies

### MNEE Token

MNEE is a stablecoin used for all payments in Twinkle.

- **Mainnet**: `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF`
- **Testnet**: TestMNEE at `0xF730d47c3003eCaE2608C452BCD5b0edf825e51C`

### Sablier V3

Used for streaming payments in escrow contracts.

- **Sepolia**: `0x6b0307b4338f2963A62106028E3B074C2c0510DA`
- **Mainnet**: `0x3962f6585946823440d274aD7C719B02b49DE51E`

---

## Security Considerations

- All contracts use OpenZeppelin's security primitives
- Reentrancy protection on all state-changing functions
- EIP-712 signature verification for x402 payments
- Nonce tracking prevents replay attacks
- Emergency pause functionality on all contracts
- Platform fee limits (max 10%)
- MNEE compliance checks (blacklist, freeze, pause)

---

## References

- [x402.org](https://www.x402.org/) - x402 Protocol Specification
- [Coinbase x402 Docs](https://docs.cdp.coinbase.com/x402/welcome) - Implementation Guide
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712) - Typed Data Signing
- [Sablier Docs](https://docs.sablier.com/) - Streaming Protocol
- [Ponder Docs](https://ponder.sh/docs) - Indexer Framework
- [MCP Protocol](https://modelcontextprotocol.io/) - Model Context Protocol

---

## License

MIT License - see LICENSE file for details.
