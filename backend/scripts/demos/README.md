# Twinkle Demo Scripts

UI-less TypeScript scripts demonstrating all Twinkle features.

## Prerequisites

1. **Start infrastructure**:
   ```bash
   # From the backend directory
   docker-compose up -d  # PostgreSQL + Redis
   ```

2. **Start services** (in separate terminals):
   ```bash
   # API (port 3000)
   pnpm --filter @twinkle/api dev

   # Facilitator (port 3001)
   pnpm --filter @twinkle/facilitator dev

   # Indexer
   pnpm --filter @twinkle/indexer dev

   # MCP Server (port 3002) - optional
   pnpm --filter @twinkle/mcp-server dev
   ```

3. **Test wallet has funds**:
   - Needs: Sepolia ETH (~0.05) for gas
   - Needs: tMNEE tokens (get from TestMNEE faucet)

## Running Demos

```bash
cd scripts/demos

# Run any demo
npx tsx demo-api-queries.ts
npx tsx demo-x402-agent.ts
npx tsx demo-paywall-flow.ts
npx tsx demo-subscription.ts
npx tsx demo-escrow.ts
npx tsx demo-split.ts
npx tsx demo-mcp-tools.ts
npx tsx demo-full-workflow.ts
```

## Demo Descriptions

### `demo-api-queries.ts`
Query all REST API endpoints:
- Health checks
- List paywalls, subscriptions, projects, splits
- Check unlock status
- View analytics

### `demo-x402-agent.ts` ⭐
**Most important** - Full x402 AI agent payment flow:
1. Simulate 402 Payment Required response
2. Build EIP-712 PaymentIntent
3. Sign with wallet (off-chain)
4. Create X-PAYMENT header
5. Submit to facilitator
6. Verify settlement

### `demo-paywall-flow.ts`
Complete paywall lifecycle:
1. Create paywall with price
2. Query via API
3. Check unlock status
4. Pay to unlock
5. Verify access

### `demo-subscription.ts`
Subscription plan workflow:
1. Create subscription plan
2. Subscribe as user
3. Check subscription status
4. View renewal info

### `demo-escrow.ts`
Freelance project escrow:
1. Create project with milestones
2. Fund project (client)
3. Milestone completion workflow
4. Fund release

### `demo-split.ts`
Revenue split distribution:
1. Create split with recipients
2. Configure share percentages
3. Deposit funds
4. Distribute to recipients

### `demo-mcp-tools.ts`
Test MCP server tools:
- `twinkle_check_balance`
- `twinkle_get_paywall`
- `twinkle_check_unlock`
- `twinkle_create_payment_intent`
- `twinkle_get_payment_request`
- `twinkle_get_plan`
- `twinkle_check_subscription`
- `twinkle_get_subscription`

### `demo-full-workflow.ts`
End-to-end demonstration of all features combined.

## Shared Library (`lib/`)

| File | Purpose |
|------|---------|
| `config.ts` | Contract addresses, RPC URLs, default settings |
| `wallet.ts` | Viem wallet setup, balance checks, approvals |
| `api.ts` | REST API client wrapper |
| `contracts.ts` | Contract interaction helpers |
| `eip712.ts` | EIP-712 signing for x402 payments |

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

## x402 Protocol Reference

The x402 protocol enables AI agents to pay for resources:

```
1. Agent requests resource
   → GET /api/premium-content

2. Server responds 402 with payment requirements
   ← HTTP 402 Payment Required
   ← X-Payment-Amount: 1000000000000000000
   ← X-Payment-Asset: 0xDEe5671FcFC26207295E4352E8bDf6785519e4EF
   ← X-Payment-PayTo: 0x...

3. Agent signs EIP-712 PaymentIntent
   → signTypedData({ domain, types, message })

4. Agent retries with X-PAYMENT header
   → GET /api/premium-content
   → X-PAYMENT: base64(payload)

5. Facilitator settles on-chain
   → TwinkleX402.settle(requestId, intent, signature)

6. Server verifies access proof
   → TwinkleX402.verifyAccessProof(accessProofId)

7. Content delivered
   ← HTTP 200 + content
```

## Environment Variables

Required environment variables (set these before running demos):

```bash
# Required
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
TEST_PRIVATE_KEY=0x...  # Your test wallet private key

# Optional (defaults shown)
API_URL=http://localhost:3000
FACILITATOR_URL=http://localhost:3001
MCP_SERVER_URL=http://localhost:3002
```

Create a `.env` file in the demos directory or export these variables before running.

## Troubleshooting

**"API not responding"**
- Ensure API is running: `pnpm --filter @twinkle/api dev`
- Check port 3000 is not in use

**"Facilitator not responding"**
- Ensure Facilitator is running: `pnpm --filter @twinkle/facilitator dev`
- Check port 3001 is not in use

**"Transaction reverted"**
- Check wallet has sufficient ETH for gas
- Check wallet has sufficient tMNEE tokens
- Ensure MNEE is approved for the contract

**"Paywall not indexed"**
- Wait longer for Ponder to sync
- Check indexer logs for errors

## References

- [x402.org](https://www.x402.org/) - Protocol specification
- [Coinbase x402 Docs](https://docs.cdp.coinbase.com/x402/welcome) - Implementation guide
- [GitHub coinbase/x402](https://github.com/coinbase/x402) - Reference implementation
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712) - Typed data signing
