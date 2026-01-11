# MCP Server Integration Guide

Guide for integrating the Twinkle MCP (Model Context Protocol) server with AI agents.

## Overview

The MCP server provides AI agents with tools to:
- Check MNEE token balances
- Get paywall information
- Create payment intents
- Check subscription status
- Verify access to paywalled content

## Installation

### Claude Desktop Integration

Add to Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "twinkle": {
      "command": "node",
      "args": ["/path/to/twinkle/backend/apps/mcp-server/dist/index.js"],
      "env": {
        "PONDER_RPC_URL_11155111": "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

### Building the Server

```bash
cd /path/to/twinkle/backend
pnpm install
pnpm --filter @twinkle/mcp-server build
```

### Running Standalone

```bash
# For testing (stdio mode)
node apps/mcp-server/dist/index.js
```

---

## Available Tools

### twinkle_check_balance

Check MNEE token balance for an Ethereum address.

**Input Schema**:
```json
{
  "address": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{40}$",
    "description": "Ethereum address to check balance for"
  }
}
```

**Example**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2c34d"
}
```

**Output**:
```json
{
  "success": true,
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2c34d",
  "balance": "100.0",
  "symbol": "tMNEE",
  "raw": "100000000000000000000"
}
```

---

### twinkle_get_paywall

Get details of a Twinkle paywall including price and unlock status.

**Input Schema**:
```json
{
  "paywallId": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{64}$",
    "description": "Paywall ID (bytes32 hex string)"
  }
}
```

**Example**:
```json
{
  "paywallId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**Output**:
```json
{
  "success": true,
  "paywallId": "0x...",
  "exists": true,
  "creator": "0x...",
  "price": "1.0",
  "splitAddress": "0x...",
  "totalUnlocks": 50,
  "totalRevenue": "50.0",
  "active": true,
  "x402Enabled": true
}
```

---

### twinkle_check_unlock

Check if a user has unlocked a specific paywall.

**Input Schema**:
```json
{
  "paywallId": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{64}$",
    "description": "Paywall ID to check"
  },
  "userAddress": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{40}$",
    "description": "User address to check unlock status for"
  }
}
```

**Example**:
```json
{
  "paywallId": "0x1234...",
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2c34d"
}
```

**Output**:
```json
{
  "success": true,
  "paywallId": "0x...",
  "userAddress": "0x...",
  "unlocked": false
}
```

---

### twinkle_create_payment_intent

Create a payment intent for the user to sign. Returns EIP-712 typed data.

**Input Schema**:
```json
{
  "payerAddress": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{40}$",
    "description": "Address that will pay"
  },
  "recipientAddress": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{40}$",
    "description": "Address to receive payment"
  },
  "amount": {
    "type": "string",
    "description": "Amount in MNEE (e.g., '10.5')"
  },
  "paywallId": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{64}$",
    "description": "Optional paywall ID to unlock",
    "optional": true
  }
}
```

**Example**:
```json
{
  "payerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2c34d",
  "recipientAddress": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
  "amount": "1.5",
  "paywallId": "0x1234..."
}
```

**Output**:
```json
{
  "success": true,
  "action": "sign_payment_intent",
  "intentData": {
    "payer": "0x...",
    "requestId": "0x...",
    "amount": "1500000000000000000",
    "validUntil": "1736600000",
    "nonce": "1704931200000"
  },
  "domain": {
    "name": "TwinkleX402",
    "version": "2",
    "chainId": 11155111,
    "verifyingContract": "0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3"
  },
  "types": {
    "PaymentIntent": [
      { "name": "payer", "type": "address" },
      { "name": "requestId", "type": "bytes32" },
      { "name": "amount", "type": "uint256" },
      { "name": "validUntil", "type": "uint256" },
      { "name": "nonce", "type": "uint256" }
    ]
  },
  "message": "Sign to authorize payment of 1.5 MNEE to 0x8626..."
}
```

---

### twinkle_get_payment_request

Get details of an x402 payment request.

**Input Schema**:
```json
{
  "requestId": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{64}$",
    "description": "Payment request ID"
  }
}
```

**Output**:
```json
{
  "success": true,
  "requestId": "0x...",
  "exists": true,
  "payTo": "0x...",
  "amount": "1.0",
  "paywallId": "0x...",
  "validUntil": "1736600000",
  "settled": false
}
```

---

### twinkle_get_plan

Get details of a subscription plan.

**Input Schema**:
```json
{
  "planId": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{64}$",
    "description": "Subscription plan ID"
  }
}
```

**Output**:
```json
{
  "success": true,
  "planId": "0x...",
  "exists": true,
  "creator": "0x...",
  "price": "10.0",
  "intervalDays": 30,
  "trialDays": 7,
  "active": true,
  "subscriberCount": 100
}
```

---

### twinkle_check_subscription

Check if a user has an active subscription to a plan.

**Input Schema**:
```json
{
  "planId": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{64}$",
    "description": "Subscription plan ID"
  },
  "userAddress": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{40}$",
    "description": "User address to check subscription for"
  }
}
```

**Output**:
```json
{
  "success": true,
  "planId": "0x...",
  "userAddress": "0x...",
  "valid": true,
  "subscriptionId": "0x..."
}
```

---

### twinkle_get_subscription

Get details of a specific subscription.

**Input Schema**:
```json
{
  "subId": {
    "type": "string",
    "pattern": "^0x[a-fA-F0-9]{64}$",
    "description": "Subscription ID"
  }
}
```

**Output**:
```json
{
  "success": true,
  "subscriptionId": "0x...",
  "exists": true,
  "planId": "0x...",
  "subscriber": "0x...",
  "startedAt": "2024-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
  "active": true,
  "cancelled": false
}
```

---

## Resources

### twinkle://config

Get protocol configuration and contract addresses.

**URI**: `twinkle://config`
**MIME Type**: `application/json`

**Content**:
```json
{
  "chainId": 11155111,
  "network": "sepolia",
  "contracts": {
    "TwinkleCore": "0x0DF0E3024350ea0992a7485aDbDE425a79983c09",
    "TwinklePay": "0xAE1a483ce67a796FcdC7C986CbB556f2975bE190",
    "TwinkleSubscription": "0xa4436C50743FF1eD0C38318A32F502b2A5F899E6",
    "TwinkleEscrow": "0xa04CE96fccBB6C08eA930dB97B8479F33F8f5931",
    "TwinkleSplit": "0x987c621118D66A1F58C032EBdDe8F4f3385B71E4",
    "TwinkleX402": "0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3",
    "TestMNEE": "0xF730d47c3003eCaE2608C452BCD5b0edf825e51C"
  },
  "token": {
    "address": "0xF730d47c3003eCaE2608C452BCD5b0edf825e51C",
    "symbol": "tMNEE",
    "decimals": 18
  }
}
```

---

## AI Agent Usage Patterns

### Check Access Before Serving Content

```
1. Get paywall info: twinkle_get_paywall({ paywallId })
2. Check if user has access: twinkle_check_unlock({ paywallId, userAddress })
3. If unlocked, serve content
4. If not, create payment intent and prompt user to pay
```

### Payment Flow

```
1. Check user balance: twinkle_check_balance({ address })
2. If sufficient, create payment intent: twinkle_create_payment_intent(...)
3. Return typed data to user for signing
4. User signs with wallet
5. Submit signature to facilitator for settlement
```

### Subscription Verification

```
1. Check subscription status: twinkle_check_subscription({ planId, userAddress })
2. If valid, grant access
3. If not valid, prompt to subscribe
```

---

## Error Handling

All tools return errors in this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Invalid address format` | Address doesn't match regex | Ensure 0x + 40 hex chars |
| `Invalid paywall/plan ID` | ID doesn't match regex | Ensure 0x + 64 hex chars |
| `RPC connection failed` | Network issues | Check RPC_URL is valid |
| `Contract call failed` | On-chain error | Check contract addresses |

---

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PONDER_RPC_URL_11155111` | Sepolia RPC endpoint |
| `LOG_LEVEL` | Logging level (default: warn) |
| `SENTRY_DSN` | Sentry error tracking (optional) |

### RPC Fallback

The MCP server uses RPC fallback for reliability. Configure multiple RPCs:

```bash
PONDER_RPC_URL_11155111=https://provider1.com/key,https://provider2.com/key
```

---

## Troubleshooting

### Server Not Responding

1. Check the server started: Look for "Twinkle MCP Server started" in stderr
2. Verify RPC URL is accessible
3. Check LOG_LEVEL=debug for detailed logs

### Tool Returning Errors

1. Verify input format matches schema (address: 0x + 40 hex, ID: 0x + 64 hex)
2. Check the contract/resource exists on-chain
3. Ensure RPC is synced to current block

### Claude Desktop Not Finding Server

1. Verify path in config is absolute
2. Check `dist/index.js` exists (run build first)
3. Restart Claude Desktop after config changes
