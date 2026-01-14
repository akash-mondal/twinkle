# @twinkle/sdk

The official TypeScript SDK for the **Twinkle Protocol**. Easily interact with Twinkle's Pay, Subscription, Escrow, and Split contracts, and query the **Twinkle Indexer API**.

![Twinkle Protocol](https://via.placeholder.com/1200x300?text=Twinkle+Protocol+SDK)

## Features

- 🔐 **Paywalls**: Create and unlock content with crypto payments.
- 🔄 **Subscriptions**: Recurring billing with auto-expiration checks.
- 💸 **Splits**: Revenue sharing contracts for teams and collaborations.
- 🤝 **Escrows**: Milestone-based project funding with arbitration support.
- ⚡ **Indexer API**: Fast, typed access to indexed protocol data.

## Installation

```bash
pnpm add @twinkle/sdk viem
# or
npm install @twinkle/sdk viem
```

## Quick Start

Initialize the SDK configuration. By default, it connects to **Ethereum Mainnet** and the **Production API** (`https://tw1nkl3.rest`).

```typescript
import { 
    initTwinkle, 
    createWalletClientInstance, 
    createPublicClientInstance,
    api // Typed API Client
} from '@twinkle/sdk';

// 1. Initialize Configuration (Optional)
// Defaults to Mainnet + Production API.
initTwinkle({
    // chainId: 11155111, // Sepolia (if testing)
});

// 2. Create Clients
// Public Client (Read-only)
const publicClient = createPublicClientInstance();

// Wallet Client (Write operations - requires Private Key or Account)
// NEVER hardcode private keys in frontend code!
const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
const walletClient = createWalletClientInstance(privateKey);
```

## Usage Examples

### 🔐 Paywalls

Create granular access control for your content.

```typescript
import { createPaywall, payForPaywall, isUnlocked, parseEther } from '@twinkle/sdk';

// Create a Paywall (Client-side)
const { paywallId, hash } = await createPaywall(walletClient, publicClient, {
  contentId: 'premium-article-123',
  price: parseEther('0.001'), // Price in ETH/MNEE
});
console.log(`Paywall Created: ${paywallId}`);

// Pay for Access (User-side)
await payForPaywall(walletClient, publicClient, paywallId);

// Verify Access (Anywhere)
const hasAccess = await isUnlocked(publicClient, paywallId, userAddress);
if (hasAccess) {
  // Show content
}
```

### 🔄 Subscriptions

Set up recurring revenue models. Requires **MNEE** tokens (on supported chains) for payment.

```typescript
import { createSubscriptionPlan, subscribeToPlan, approveMnee } from '@twinkle/sdk';

// 1. Create a Plan
const { planId } = await createSubscriptionPlan(walletClient, publicClient, {
  price: parseEther('10'), // 10 Tokens
  interval: 30 * 24 * 60 * 60, // 30 Days (in seconds)
});

// 2. Approve Tokens (Before subscribing)
await approveMnee(walletClient, publicClient, SDK_CONFIG.contracts.TwinkleSubscription, parseEther('100'));

// 3. Subscribe
await subscribeToPlan(walletClient, publicClient, planId);
```

### 💸 Splits

Distribute revenue automatically between multiple recipients.

```typescript
import { createSplit } from '@twinkle/sdk';

const { splitId } = await createSplit(walletClient, publicClient, {
  recipients: ['0xAlice...', '0xBob...'],
  shares: [500000n, 500000n], // 50% / 50% (Shares sum to 1,000,000)
});
```

### 🤝 Escrow

Manage freelancer/client relationships with milestone payments.

```typescript
import { createEscrowProject, fundEscrowProject, requestMilestone, approveMilestone } from '@twinkle/sdk';

// Client creates project
const { projectId } = await createEscrowProject(walletClient, publicClient, {
  freelancer: '0xFreelancer...',
  milestoneAmounts: [parseEther('100'), parseEther('100')], // Two milestones
  duration: 86400 * 30, // 30 days
});

// Client funds project
await fundEscrowProject(walletClient, publicClient, projectId);

// Freelancer requests payout (Milestone 0)
await requestMilestone(freelancerWallet, publicClient, projectId, 0n);

// Client approves payout
await approveMilestone(clientWallet, publicClient, projectId, 0n);
```

### ⚡ Indexer API

Fetch indexed data directly from the Twinkle backend without querying the blockchain.

```typescript
// Fetch all projects for a client
const projects = await api.getProjects({ client: '0xClientAddress...' });

// Fetch a specific paywall
const paywall = await api.getPaywall('0xPaywallId...');
console.log(`Creator: ${paywall.creator}, Revenue: ${paywall.totalRevenue}`);
```

## Chains Supported

- **Ethereum Mainnet** (Default)
- **Sepolia Testnet**

## License

MIT
