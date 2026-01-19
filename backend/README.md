# Twinkle Backend

Event indexing, x402 facilitator, MCP server, and APIs for the Twinkle.

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

# Start infrastructure (PostgreSQL + Redis)
pnpm docker:up

# Copy environment file and configure
cp .env.example .env
# Edit .env with your RPC URL and other settings

# Build shared package first (required before running services)
pnpm --filter @twinkle/shared build

# Run all services
pnpm dev
```

### Running Services Individually

If you encounter issues with `pnpm dev`, you can start services individually:

```bash
# Terminal 1: Start the indexer
pnpm indexer:dev

# Terminal 2: Start the facilitator
pnpm facilitator:dev

# Terminal 3: Start the API
pnpm api:dev
```

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| API | 3000 | http://localhost:3000 |
| Facilitator | 3001 | http://localhost:3001 |
| Indexer (GraphQL) | 42069 | http://localhost:42069 |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |

### Running with Frontend

**Port Conflict:** The API defaults to port 3000, which conflicts with the Next.js frontend.

When running both frontend and backend together, start the API on a different port:

```bash
# Option 1: Start API on port 3002
API_PORT=3002 pnpm api:dev

# Option 2: Or run individual services with custom port
cd apps/api && API_PORT=3002 pnpm dev
```

**Recommended full-stack development setup:**

```bash
# Terminal 1: Start infrastructure
pnpm docker:up

# Terminal 2: Start indexer
pnpm indexer:dev

# Terminal 3: Start facilitator
pnpm facilitator:dev

# Terminal 4: Start API on port 3002 (to avoid conflict with frontend)
API_PORT=3002 pnpm api:dev

# Terminal 5: Start frontend (in /web directory)
cd ../web && pnpm dev
```

| Service | Port | Notes |
|---------|------|-------|
| Frontend | 3000 | Next.js dev server |
| Facilitator | 3001 | x402 settlement |
| API | 3002 | REST API (use `API_PORT=3002`) |
| Indexer | 42069 | GraphQL endpoint |

## Services

### Ponder Indexer (`apps/indexer`)

Indexes all Twinkle events from Sepolia.

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

## Contract Addresses (Mainnet)

| Contract | Address |
|----------|---------|
| TwinkleCore | `0x68Ab986EBd3A3307E04b0384fB483e528D16D013` |
| TwinklePay | `0xa3DB430aFD3e92b4991842A3D167E8487E9a8bFF` |
| TwinkleSplit | `0xDEe5671FcFC26207295E4352E8bDf6785519e4EF` |
| TwinkleEscrow | `0x19AF229901db0ae11fafc536606b592a3524e28d` |
| TwinkleSubscription | `0x902E0D39D872b3CD1f7d82bb4Ee8beBd7b045Ff8` |
| TwinkleX402 | `0x348356f71539CCc13695a4868541B9bC18764A0F` |
| MNEE | `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF` |
| SablierLockup | `0xcF8ce57fa442ba50aCbC57147a62aD03873FfA73` |

## Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| TwinkleCore | `0x902E0D39D872b3CD1f7d82bb4Ee8beBd7b045Ff8` |
| TwinklePay | `0x348356f71539CCc13695a4868541B9bC18764A0F` |
| TwinkleSplit | `0xdF74B5bAf4F9F85AdE8dFc8F19D5cF47F3b14aA2` |
| TwinkleEscrow | `0x57526eBA750E9E216955f7Ea89917c759169016c` |
| TwinkleSubscription | `0x8ABb57F7a5d74C0B54aF030A7988a5dD18fC4907` |
| TwinkleX402 | `0x1EDc124D1608Cca16F7B27B4027EFaF40AE3BC62` |
| TestMNEE | `0xDEe5671FcFC26207295E4352E8bDf6785519e4EF` |
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
