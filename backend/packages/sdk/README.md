# @twinkle/sdk

The official TypeScript SDK for the Twinkle Protocol. Easily interact with Twinkle's Pay, Subscription, Escrow, and Split contracts.

## Installation

```bash
pnpm add @twinkle/sdk viem
# or
npm install @twinkle/sdk viem
```

## Setup

Initialize the SDK with your configuration. By default, it connects to Ethereum Mainnet.

```typescript
import { initTwinkle, createWalletClientInstance, createPublicClientInstance } from '@twinkle/sdk';

// Optional: Override defaults (e.g., to use Sepolia)
initTwinkle({
  chainId: 11155111, // Sepolia
  // contracts: { ... } // Override contract addresses if needed
});

const publicClient = createPublicClientInstance();
// For write operations, provide a private key or account
const walletClient = createWalletClientInstance(process.env.PRIVATE_KEY!);
```

## Usage

### Twinkle Pay (Paywalls)

```typescript
import { createPaywall, payForPaywall, isUnlocked } from '@twinkle/sdk';

// Create a paywall
const { paywallId } = await createPaywall(walletClient, publicClient, {
  contentId: 'my-premium-blog-post-1',
  price: 1000000000000000000n, // 1 MNEE
});

// Check access
const hasAccess = await isUnlocked(publicClient, paywallId, userAddress);

// Pay for access
await payForPaywall(walletClient, publicClient, paywallId);
```

### Twinkle Subscriptions

```typescript
import { createSubscriptionPlan, subscribeToPlan, isSubscribedToPlan } from '@twinkle/sdk';

// Create a plan
const { planId } = await createSubscriptionPlan(walletClient, publicClient, {
  price: 5000000000000000000n, // 5 MNEE
  interval: 30 * 24 * 60 * 60, // 30 days
});

// Subscribe
await subscribeToPlan(walletClient, publicClient, planId);

// Verify subscription
const isValid = await isSubscribedToPlan(publicClient, planId, userAddress);
```

### Twinkle Escrow

```typescript
import { createEscrowProject, fundEscrowProject, releaseMilestone } from '@twinkle/sdk';

// Client creates a project
const { projectId } = await createEscrowProject(walletClient, publicClient, {
  freelancer: '0x...',
  milestoneAmounts: [100n, 200n],
});

// Funding and releasing milestones
await fundEscrowProject(walletClient, publicClient, projectId);
// ...
```

## API Access

The SDK includes a typed client for the Twinkle Indexer API.

```typescript
import { api } from '@twinkle/sdk';

const projects = await api.getProjects();
const paywalls = await api.getPaywalls({ creator: '0x...' });
```
