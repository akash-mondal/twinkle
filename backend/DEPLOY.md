# Twinkle Backend - VPS Deployment Guide

Deploy Twinkle backend services to any VPS (DigitalOcean Droplet, AWS EC2, etc.)

## Prerequisites

- VPS with Ubuntu 22.04+ (2GB RAM minimum, 4GB recommended)
- Docker and Docker Compose installed
- Domain name (optional, for SSL)

## Quick Start

### 1. SSH into your VPS

```bash
ssh root@your-server-ip
```

### 2. Install Docker (if not installed)

```bash
curl -fsSL https://get.docker.com | sh
```

### 3. Clone the repo

```bash
git clone https://github.com/Miny-Labs/twinkle.git
cd twinkle/backend
```

### 4. Configure environment

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Fill in your values:
- `POSTGRES_PASSWORD` - Strong password for PostgreSQL
- `RPC_URL` - Your Alchemy/Infura Sepolia RPC URL
- `PONDER_RPC_URL_11155111` - Same RPC URL (for indexer)
- `FACILITATOR_PRIVATE_KEY` - Private key for settlement wallet
- `DOMAIN` - Your domain (optional, leave empty for IP-only access)

### 5. Deploy

```bash
./scripts/deploy.sh setup   # First time: validates config and builds
./scripts/deploy.sh deploy  # Start all services
```

### 6. Verify

```bash
./scripts/deploy.sh status
```

Or test endpoints directly:
```bash
curl http://localhost/api/health
curl http://localhost/facilitator/health
```

## Services

| Service | Description | Internal Port |
|---------|-------------|---------------|
| API | REST API for indexed data | 8080 |
| Facilitator | x402 payment settlement | 8080 |
| Indexer | Ponder blockchain indexer | - |
| PostgreSQL | Database | 5432 |
| Redis | Caching | 6379 |
| Caddy | Reverse proxy + SSL | 80, 443 |

## Management Commands

```bash
# View status
./scripts/deploy.sh status

# View logs (all services)
./scripts/deploy.sh logs

# View logs (specific service)
./scripts/deploy.sh logs api
./scripts/deploy.sh logs indexer
./scripts/deploy.sh logs facilitator

# Restart all services
./scripts/deploy.sh restart

# Restart specific service
./scripts/deploy.sh restart indexer

# Stop all services
./scripts/deploy.sh stop

# Update to latest code
./scripts/deploy.sh update
```

## SSL Setup

### Option 1: With Domain

1. Point your domain's A record to your VPS IP
2. Set `DOMAIN=api.yourdomain.com` in `.env.prod`
3. Deploy - Caddy automatically provisions SSL via Let's Encrypt

### Option 2: Without Domain (IP only)

Leave `DOMAIN` empty or set to `localhost`. Access via:
- `http://YOUR_IP/api/`
- `http://YOUR_IP/facilitator/`

## API Endpoints

Once running, available at `https://YOUR_DOMAIN/api/`:

```
GET /                    - Service info
GET /health              - Health check
GET /metrics             - Prometheus metrics

GET /payments            - List direct payments
GET /paywalls            - List paywalls
GET /subscriptions/plans - List subscription plans
GET /projects            - List escrow projects
GET /splits              - List revenue splits
GET /x402/requests       - List x402 payment requests
GET /analytics/overview  - Protocol stats
```

Facilitator endpoints at `https://YOUR_DOMAIN/facilitator/`:

```
GET  /                   - Service info
GET  /health             - Health check
POST /verify             - Verify payment intent
POST /settle             - Settle payment on-chain
```

## Monitoring

### View real-time logs
```bash
docker logs -f twinkle-api
docker logs -f twinkle-indexer
docker logs -f twinkle-facilitator
```

### Check database
```bash
docker exec -it twinkle-postgres psql -U twinkle -d twinkle -c "\dt ponder.*"
```

### Check indexer sync status
```bash
docker logs twinkle-indexer 2>&1 | tail -20
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Verify .env.prod has all required values
cat .env.prod
```

### Database connection errors
```bash
# Check postgres is running
docker ps | grep postgres

# Check postgres logs
docker logs twinkle-postgres
```

### Indexer stuck/failing
```bash
# Check indexer logs
docker logs twinkle-indexer -f

# Restart indexer
docker restart twinkle-indexer
```

### API returning "relation does not exist"
The indexer hasn't created tables yet. Wait for indexer to sync:
```bash
docker logs twinkle-indexer -f
# Look for: "Indexed block XXXXX"
```

## Resource Requirements

| Setup | RAM | CPU | Storage |
|-------|-----|-----|---------|
| Minimum | 2GB | 1 vCPU | 20GB |
| Recommended | 4GB | 2 vCPU | 40GB |

## Estimated Costs

| Provider | Instance | Monthly |
|----------|----------|---------|
| DigitalOcean | Basic Droplet (2GB) | $12 |
| DigitalOcean | Basic Droplet (4GB) | $24 |
| AWS | t3.small | ~$15 |
| Hetzner | CX21 | €5 |
