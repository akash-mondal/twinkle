# Twinkle Backend Deployment Guide

Production deployment guide for all Twinkle backend services.

## Prerequisites

- **Node.js**: v20.x or later
- **pnpm**: v9.x or later
- **Docker & Docker Compose**: v24.x or later
- **PostgreSQL**: v15.x (via Docker or managed)
- **Redis**: v7.x (via Docker or managed)
- **RPC Provider**: Alchemy or Infura account for Sepolia

## Architecture Overview

```
                    ┌─────────────────┐
                    │   Frontend      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │    API     │  │ Facilitator│  │ MCP Server │
     │  (REST)    │  │  (x402)    │  │  (stdio)   │
     │  :3000     │  │   :3001    │  │            │
     └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
           │               │               │
           ▼               ▼               ▼
     ┌───────────────────────────────────────────┐
     │              PostgreSQL + Redis            │
     │              (Indexed Data + Cache)        │
     └───────────────────────────────────────────┘
                             ▲
                             │
     ┌───────────────────────┴───────────────────┐
     │                  Indexer                   │
     │              (Ponder Framework)            │
     │          Syncs blockchain events           │
     └───────────────────────────────────────────┘
                             ▲
                             │
     ┌───────────────────────┴───────────────────┐
     │           Sepolia Blockchain              │
     │        (Smart Contracts)                  │
     └───────────────────────────────────────────┘
```

## Service Overview

| Service | Port | Purpose |
|---------|------|---------|
| **API** | 3000 | REST API for indexed blockchain data |
| **Facilitator** | 3001 | x402 payment settlement service |
| **Indexer** | - | Blockchain event indexing (Ponder) |
| **MCP Server** | stdio | AI agent payment tools |
| **Worker** | - | Background job processing |

## Quick Start (Development)

```bash
# 1. Clone and install
cd /path/to/twinkle/backend
pnpm install

# 2. Start infrastructure
docker-compose up -d

# 3. Copy and configure environment
cp .env.example .env
# Edit .env with your RPC URL and keys

# 4. Build packages
pnpm build

# 5. Start services (in separate terminals)
pnpm --filter @twinkle/indexer dev     # Start indexer first
pnpm --filter @twinkle/api dev         # Then API
pnpm --filter @twinkle/facilitator dev # Then Facilitator
```

## Production Deployment

### 1. Infrastructure Setup

#### Option A: Docker Compose (Recommended for small deployments)

```bash
# Start all infrastructure
docker-compose up -d

# Verify health
docker-compose ps
docker-compose exec postgres pg_isready -U twinkle
docker-compose exec redis redis-cli ping
```

#### Option B: Managed Services

For production, use managed services:
- **PostgreSQL**: AWS RDS, GCP Cloud SQL, or Supabase
- **Redis**: AWS ElastiCache, GCP Memorystore, or Upstash

### 2. Environment Configuration

Create production environment file:

```bash
# Required variables
DATABASE_URL=postgresql://user:pass@host:5432/twinkle
REDIS_URL=redis://:password@host:6379
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/<KEY>
FACILITATOR_PRIVATE_KEY=0x...  # Settlement wallet key

# Optional but recommended
LOG_LEVEL=info
NODE_ENV=production
SENTRY_DSN=https://...@sentry.io/...
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
```

### 3. Service Startup Order

**Critical**: Services must start in this order:

1. **Infrastructure** (PostgreSQL, Redis)
2. **Indexer** - Creates database schema and syncs events
3. **API** - Serves indexed data
4. **Facilitator** - Handles payment settlements
5. **Worker** - Background jobs (optional)

Wait for each service to be healthy before starting the next.

### 4. Health Verification

```bash
# API health
curl http://localhost:3000/health
# Expected: {"status":"healthy","checks":{"redis":{"status":"ok"},"database":{"status":"ok"}}}

# Facilitator health
curl http://localhost:3001/health
# Expected: {"status":"healthy","checks":{"redis":{"status":"ok"},"rpc":{"status":"ok"}}}

# Root endpoint for service info
curl http://localhost:3000/
curl http://localhost:3001/
```

### 5. Production Considerations

#### Security Checklist

- [ ] Use TLS/HTTPS for all endpoints
- [ ] Set `NODE_ENV=production`
- [ ] Use strong passwords for PostgreSQL and Redis
- [ ] Store private keys in secure vault (AWS Secrets Manager, HashiCorp Vault)
- [ ] Enable rate limiting (configured by default)
- [ ] Configure firewall rules for database access
- [ ] Use separate RPC API keys for each service

#### Scaling

**Horizontal Scaling**:
- API: Run multiple instances behind load balancer
- Facilitator: Run multiple instances (nonce manager ensures transaction safety)

**Vertical Scaling**:
- Indexer: Single instance recommended (Ponder handles this)
- Worker: Adjust `WORKER_CONCURRENCY` environment variable

#### Monitoring

- Prometheus metrics at `/metrics` on API and Facilitator
- Structured JSON logs via Pino
- Sentry error tracking (configure SENTRY_DSN)
- OpenTelemetry tracing (configure OTEL_EXPORTER_OTLP_ENDPOINT)

### 6. Docker Production Build

```dockerfile
# Example Dockerfile for API
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "apps/api/dist/index.js"]
```

### 7. Process Management

Use PM2 or systemd for process management:

```bash
# PM2
pm2 start apps/api/dist/index.js --name twinkle-api
pm2 start apps/facilitator/dist/index.js --name twinkle-facilitator

# View logs
pm2 logs twinkle-api

# Restart
pm2 restart all
```

## Graceful Shutdown

All services handle SIGTERM and SIGINT:
- Stop accepting new requests
- Complete in-flight requests
- Close database/Redis connections
- Exit cleanly

Kubernetes/Docker will send SIGTERM. Default timeout is 10 seconds.

## Troubleshooting

### Common Issues

**1. Database connection refused**
```bash
# Check PostgreSQL is running
docker-compose ps postgres
docker-compose logs postgres
```

**2. Redis connection failed**
```bash
# Check Redis is running
docker-compose exec redis redis-cli ping
```

**3. RPC errors**
```bash
# Verify RPC URL is correct
curl -X POST <RPC_URL> \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**4. Indexer not syncing**
```bash
# Check indexer logs
pnpm --filter @twinkle/indexer dev

# Verify START_BLOCK is correct
# Should be before contract deployment block
```

**5. Rate limited**
```bash
# Check rate limit headers
curl -I http://localhost:3000/payments
# Look for X-RateLimit-* headers
```

## Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| TwinkleCore | `0x0DF0E3024350ea0992a7485aDbDE425a79983c09` |
| TwinklePay | `0xAE1a483ce67a796FcdC7C986CbB556f2975bE190` |
| TwinkleSplit | `0x987c621118D66A1F58C032EBdDe8F4f3385B71E4` |
| TwinkleEscrow | `0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931` |
| TwinkleSubscription | `0xa4436C50743FF1eD0C38318A32F502b2A5F899E6` |
| TwinkleX402 | `0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3` |
| TestMNEE (Token) | `0xF730d47c3003eCaE2608C452BCD5b0edf825e51C` |

## Support

- Issues: https://github.com/twinkle/backend/issues
- Documentation: See other docs in this directory
