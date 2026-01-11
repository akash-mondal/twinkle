# DigitalOcean App Platform Deployment

Deploy Twinkle backend services to DigitalOcean App Platform.

## Prerequisites

1. DigitalOcean account
2. doctl CLI installed and authenticated
3. GitHub repo connected to DigitalOcean

## Quick Deploy

### Option 1: Via CLI

```bash
# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec .do/app.yaml

# Or update existing app
doctl apps update <app-id> --spec .do/app.yaml
```

### Option 2: Via Dashboard

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Select GitHub repo: `Miny-Labs/twinkle`
4. DigitalOcean will detect `.do/app.yaml`
5. Configure secrets
6. Deploy

## Set Secrets

After creating the app, set these secrets:

```bash
# Get app ID
doctl apps list

# Set secrets
doctl apps update <app-id> --spec .do/app.yaml
```

Or set via Dashboard > App > Settings > App-Level Environment Variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Auto-set if using DO managed DB |
| `REDIS_URL` | Upstash Redis URL |
| `PONDER_RPC_URL_11155111` | Alchemy/Infura Sepolia RPC |
| `PONDER_DATABASE_URL` | Same as DATABASE_URL |
| `FACILITATOR_PRIVATE_KEY` | Settlement wallet private key |

## Services

| Service | Type | Path | Port |
|---------|------|------|------|
| API | HTTP | /api | 8080 |
| Facilitator | HTTP | /facilitator | 8080 |
| Indexer | Worker | - | - |

## Custom Domain

1. Go to App > Settings > Domains
2. Add your domain (e.g., `api.twinkle.example.com`)
3. Add DNS records as shown
4. SSL is automatic

## Scaling

```bash
# Scale API to 2 instances
doctl apps update <app-id> --spec .do/app.yaml
# (modify instance_count in app.yaml first)
```

Or via Dashboard > App > Settings > Resources

## Logs

```bash
# View logs
doctl apps logs <app-id> --type run

# Follow logs
doctl apps logs <app-id> --type run --follow
```

## Costs (Estimated)

| Resource | Size | Monthly |
|----------|------|---------|
| API | basic-xxs | $5 |
| Facilitator | basic-xxs | $5 |
| Indexer | basic-xs | $10 |
| PostgreSQL | db-s-1vcpu-1gb | $15 |
| **Total** | | **~$35/mo** |

## Troubleshooting

### Build fails
- Check Dockerfile syntax
- Verify all dependencies in package.json

### App crashes
- Check logs: `doctl apps logs <app-id>`
- Verify environment variables are set

### Database connection issues
- Ensure DATABASE_URL is set correctly
- Check if DB is in same region as app
