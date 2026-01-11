# Twinkle Protocol Backend

Event indexing, x402 facilitator, MCP server, and APIs for the Twinkle Protocol.

## Architecture

```
backend/
├── packages/
│   └── shared/              # Shared types, ABIs, constants
│
└── apps/
    ├── indexer/             # Ponder blockchain indexer
    ├── facilitator/         # x402 Facilitator (EIP-712 verification & settlement)
    ├── mcp-server/          # MCP Server for Claude/GPT AI agents
    ├── api/                 # REST API
    └── worker/              # Background jobs (TODO)
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL & Redis)

### Setup

```bash
# Install dependencies
pnpm install

# Start infrastructure
pnpm docker:up

# Copy environment file and configure
cp .env.example .env
# Edit .env with your RPC URL

# Run services
pnpm dev
```

## Services

### Ponder Indexer (`apps/indexer`)

Indexes all Twinkle Protocol events from Sepolia.

```bash
# Development
pnpm indexer:dev

# Production
cd apps/indexer && pnpm start
```

**Indexed Contracts:**
- TwinkleCore - Protocol configuration, fees, emergency controls
- TwinklePay - Paywalls, direct payments, refunds
- TwinkleSplit - Revenue splits, distributions
- TwinkleEscrow - Freelance escrow, milestones, Sablier streams
- TwinkleSubscription - Subscription plans, renewals
- TwinkleX402 - AI agent payment settlements

### x402 Facilitator (`apps/facilitator`)

Handles EIP-712 signature verification and on-chain settlement.

```bash
# Development
pnpm facilitator:dev

# Production
cd apps/facilitator && pnpm start
```

**Endpoints:**
- `GET /` - Health check
- `GET /supported` - Supported networks and assets
- `POST /verify` - Verify payment payload signature
- `POST /settle` - Execute settlement on-chain
- `POST /settle-ap2` - Settle with agent metadata
- `GET /request/:id` - Get payment request details

### MCP Server (`apps/mcp-server`)

Model Context Protocol server for AI agent payments.

```bash
# Build and run
cd apps/mcp-server && pnpm build
node dist/index.js
```

**Tools:**
- `twinkle_check_balance` - Check MNEE balance
- `twinkle_get_paywall` - Get paywall details
- `twinkle_check_unlock` - Check paywall unlock status
- `twinkle_create_payment_intent` - Create EIP-712 typed data for signing
- `twinkle_get_payment_request` - Get x402 request details
- `twinkle_get_plan` - Get subscription plan
- `twinkle_check_subscription` - Check subscription status
- `twinkle_get_subscription` - Get subscription details

**Claude Desktop Configuration:**

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "twinkle": {
      "command": "node",
      "args": ["/path/to/backend/apps/mcp-server/dist/index.js"],
      "env": {
        "RPC_URL": "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
      }
    }
  }
}
```

### REST API (`apps/api`)

REST API for querying indexed blockchain data.

```bash
# Development
pnpm api:dev

# Production
cd apps/api && pnpm start
```

**Endpoints:**

| Endpoint | Description |
|----------|-------------|
| `GET /` | Health check & contract info |
| `GET /payments` | List direct payments |
| `GET /payments/:txHash` | Get payment by tx hash |
| `GET /paywalls` | List paywalls |
| `GET /paywalls/:id` | Get paywall details |
| `GET /paywalls/:id/unlocks` | Get paywall unlocks |
| `GET /paywalls/:id/check/:addr` | Check if user unlocked |
| `GET /subscriptions/plans` | List subscription plans |
| `GET /subscriptions/plans/:id` | Get plan details |
| `GET /subscriptions/:id` | Get subscription details |
| `GET /subscriptions/user/:addr` | Get user's subscriptions |
| `GET /projects` | List escrow projects |
| `GET /projects/:id` | Get project with milestones |
| `GET /splits` | List splits |
| `GET /splits/:id` | Get split details |
| `GET /x402/requests` | List payment requests |
| `GET /x402/settlements` | List x402 settlements |
| `GET /x402/agent-payments` | List AI agent payments |
| `GET /x402/access-proofs/:id` | Verify access proof |
| `GET /analytics/overview` | Protocol overview stats |
| `GET /analytics/daily` | Daily stats |

## Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| TwinkleCore | `0x0DF0E3024350ea0992a7485aDbDE425a79983c09` |
| TwinklePay | `0xAE1a483ce67a796FcdC7C986CbB556f2975bE190` |
| TwinkleSplit | `0x987c621118D66A1F58C032EBdDe8F4f3385B71E4` |
| TwinkleEscrow | `0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931` |
| TwinkleSubscription | `0xa4436C50743FF1eD0C38318A32F502b2A5F899E6` |
| TwinkleX402 | `0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3` |
| TestMNEE | `0xF730d47c3003eCaE2608C452BCD5b0edf825e51C` |
| SablierLockup | `0x6b0307b4338f2963A62106028E3B074C2c0510DA` |

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://twinkle:twinkle_dev_password@localhost:5432/twinkle

# Redis
REDIS_URL=redis://localhost:6379

# RPC (Sepolia)
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Facilitator
FACILITATOR_PRIVATE_KEY=0x...
FACILITATOR_PORT=3001
```

## Development

```bash
# Run all services
pnpm dev

# Run specific service
pnpm indexer:dev
pnpm facilitator:dev
pnpm mcp:dev

# Type check
pnpm typecheck

# Build all
pnpm build
```

## Tech Stack

- **Ponder** - Blockchain indexer
- **Hono** - Fast HTTP framework
- **MCP SDK** - Model Context Protocol
- **viem** - Type-safe Ethereum client
- **Turborepo** - Monorepo build system
- **pnpm** - Package manager
- **PostgreSQL** - Database with TimescaleDB
- **Redis** - Caching and queues
