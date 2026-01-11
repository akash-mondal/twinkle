# Environment Variables Reference

Complete reference for all environment variables used in the Twinkle backend.

## Quick Setup

```bash
# Copy example and edit
cp .env.example .env
```

## Required Variables

These variables MUST be set for services to start.

### Database

| Variable | Required By | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | API, Indexer | PostgreSQL connection string |
| `PONDER_DATABASE_URL` | Indexer | PostgreSQL connection for Ponder |

**Format**: `postgresql://user:password@host:port/database`

**Example**:
```bash
DATABASE_URL=postgresql://twinkle:secure_password@localhost:5432/twinkle
PONDER_DATABASE_URL=postgresql://twinkle:secure_password@localhost:5432/twinkle
```

### Redis

| Variable | Required By | Description |
|----------|-------------|-------------|
| `REDIS_URL` | API, Facilitator, Worker | Redis connection string |

**Format**: `redis://[:password@]host:port[/db]`

**Example**:
```bash
REDIS_URL=redis://localhost:6379
REDIS_URL=redis://:secret_password@redis.example.com:6379/0
```

### Blockchain RPC

| Variable | Required By | Description |
|----------|-------------|-------------|
| `PONDER_RPC_URL_11155111` | Indexer, MCP, Facilitator | Sepolia RPC endpoint |

**Format**: Full HTTPS URL with API key

**Example**:
```bash
# Alchemy
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Infura
PONDER_RPC_URL_11155111=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Multiple providers (fallback)
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/KEY1,https://sepolia.infura.io/v3/KEY2
```

### Facilitator

| Variable | Required By | Description |
|----------|-------------|-------------|
| `FACILITATOR_PRIVATE_KEY` | Facilitator | Private key for settlement transactions |

**Format**: Hex string with 0x prefix (64 hex chars)

**Example**:
```bash
FACILITATOR_PRIVATE_KEY=0xabcdef1234567890...
```

**Security**:
- NEVER commit this to version control
- Use secrets manager in production (AWS Secrets Manager, Vault)
- Fund wallet with Sepolia ETH for gas

---

## Optional Variables

### Service Ports

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | 3000 | REST API port |
| `FACILITATOR_PORT` | 3001 | Facilitator HTTP port |

### Indexer Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `START_BLOCK` | 10016000 | Block to start indexing from |
| `CHAIN_ID` | 11155111 | Chain ID (Sepolia) |

### Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | info | Log level: trace, debug, info, warn, error, fatal |
| `NODE_ENV` | development | Environment: development, production, test |

**Log Level Examples**:
```bash
# Development (verbose)
LOG_LEVEL=debug
NODE_ENV=development

# Production (quiet)
LOG_LEVEL=info
NODE_ENV=production

# MCP Server (very quiet - uses stdout for protocol)
LOG_LEVEL=warn
```

### Worker Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `WORKER_CONCURRENCY` | 5 | Number of concurrent job processors |

### Security

| Variable | Description |
|----------|-------------|
| `API_KEY_SECRET` | Secret for API key generation (optional) |

### Observability

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry error tracking DSN |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector endpoint |
| `OTEL_SERVICE_NAME` | Service name for tracing (auto-set) |

**Example**:
```bash
SENTRY_DSN=https://abc123@o1234567.ingest.sentry.io/5678901
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
```

---

## Contract Addresses

These are pre-configured in the shared package but can be overridden:

| Variable | Description | Sepolia Address |
|----------|-------------|-----------------|
| `TWINKLE_CORE` | Core registry | `0x0DF0E3024350ea0992a7485aDbDE425a79983c09` |
| `TWINKLE_PAY` | Paywall contract | `0xAE1a483ce67a796FcdC7C986CbB556f2975bE190` |
| `TWINKLE_SPLIT` | Revenue splits | `0x987c621118D66A1F58C032EBdDe8F4f3385B71E4` |
| `TWINKLE_ESCROW` | Escrow projects | `0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931` |
| `TWINKLE_SUBSCRIPTION` | Subscriptions | `0xa4436C50743FF1eD0C38318A32F502b2A5F899E6` |
| `TWINKLE_X402` | x402 payments | `0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3` |
| `TESTMNEE_PROXY` | Test MNEE token | `0xF730d47c3003eCaE2608C452BCD5b0edf825e51C` |
| `SABLIER_LOCKUP` | Sablier streams | `0x6b0307b4338f2963A62106028E3B074C2c0510DA` |

---

## Per-Service Requirements

### API Service

Required:
- `DATABASE_URL`
- `REDIS_URL`

Optional:
- `API_PORT`
- `LOG_LEVEL`
- `SENTRY_DSN`

### Facilitator Service

Required:
- `REDIS_URL`
- `FACILITATOR_PRIVATE_KEY`
- `PONDER_RPC_URL_11155111`

Optional:
- `FACILITATOR_PORT`
- `LOG_LEVEL`
- `SENTRY_DSN`

### Indexer Service

Required:
- `PONDER_DATABASE_URL`
- `PONDER_RPC_URL_11155111`

Optional:
- `START_BLOCK`
- `CHAIN_ID`

### MCP Server

Required:
- `PONDER_RPC_URL_11155111` (via shared package)

Optional:
- `LOG_LEVEL`
- `SENTRY_DSN`

### Worker Service

Required:
- `REDIS_URL`

Optional:
- `WORKER_CONCURRENCY`
- `LOG_LEVEL`

---

## Environment Files

### Development (.env)

```bash
# Infrastructure
DATABASE_URL=postgresql://twinkle:twinkle_dev_password@localhost:5432/twinkle
PONDER_DATABASE_URL=postgresql://twinkle:twinkle_dev_password@localhost:5432/twinkle
REDIS_URL=redis://localhost:6379

# RPC
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Facilitator (test wallet)
FACILITATOR_PRIVATE_KEY=0x...

# Logging
LOG_LEVEL=debug
NODE_ENV=development
```

### Production (.env.production)

```bash
# Infrastructure (use managed services)
DATABASE_URL=postgresql://user:pass@db.provider.com:5432/twinkle
PONDER_DATABASE_URL=postgresql://user:pass@db.provider.com:5432/twinkle
REDIS_URL=redis://:password@redis.provider.com:6379

# RPC (multiple for redundancy)
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/KEY1,https://sepolia.infura.io/v3/KEY2

# Facilitator (production wallet - use secrets manager!)
FACILITATOR_PRIVATE_KEY=${FACILITATOR_KEY}  # Inject from secrets

# Ports
API_PORT=3000
FACILITATOR_PORT=3001

# Logging
LOG_LEVEL=info
NODE_ENV=production

# Observability
SENTRY_DSN=https://...@sentry.io/...
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
```

---

## Validation

Services validate required variables on startup. Missing variables will cause the service to exit with an error:

```
Error: Missing required environment variable: REDIS_URL
```

To test configuration:

```bash
# Check if all required vars are set
env | grep -E "(DATABASE_URL|REDIS_URL|PONDER_RPC)"
```
