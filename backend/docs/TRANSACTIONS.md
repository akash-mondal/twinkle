# Transaction Flows

Detailed transaction flow documentation for Twinkle operations.

## Overview

All transactions use the **MNEE token** (tMNEE on Sepolia) and follow EIP-712 typed data signing for secure, gasless payments.

**Chain**: Sepolia (Chain ID: 11155111)
**Token**: TestMNEE (`0xF730d47c3003eCaE2608C452BCD5b0edf825e51C`)

---

## 1. Paywall Payment Flow (x402)

The primary payment flow for unlocking paywalled content.

### Sequence Diagram

```
┌──────────┐    ┌──────────┐    ┌────────────┐    ┌──────────────┐    ┌──────────┐
│  Frontend│    │   API    │    │ Facilitator│    │  TwinkleX402 │    │ TwinklePay│
└────┬─────┘    └────┬─────┘    └─────┬──────┘    └──────┬───────┘    └────┬─────┘
     │               │                │                   │                 │
     │ 1. Get Paywall Info            │                   │                 │
     │──────────────>│                │                   │                 │
     │               │                │                   │                 │
     │ 2. Paywall Details             │                   │                 │
     │<──────────────│                │                   │                 │
     │               │                │                   │                 │
     │ 3. Create Payment Intent       │                   │                 │
     │───────────────────────────────>│                   │                 │
     │               │                │                   │                 │
     │ 4. EIP-712 Typed Data          │                   │                 │
     │<───────────────────────────────│                   │                 │
     │               │                │                   │                 │
     │ 5. User Signs with Wallet      │                   │                 │
     │ (MetaMask/WalletConnect)       │                   │                 │
     │               │                │                   │                 │
     │ 6. Submit Signed Payload       │                   │                 │
     │───────────────────────────────>│                   │                 │
     │               │                │                   │                 │
     │               │                │ 7. Verify Sig     │                 │
     │               │                │──────────────────>│                 │
     │               │                │                   │                 │
     │               │                │ 8. Execute Settle │                 │
     │               │                │──────────────────>│                 │
     │               │                │                   │                 │
     │               │                │                   │ 9. Transfer MNEE│
     │               │                │                   │────────────────>│
     │               │                │                   │                 │
     │               │                │                   │ 10. Record Unlock
     │               │                │                   │────────────────>│
     │               │                │                   │                 │
     │               │                │ 11. Access Proof  │                 │
     │               │                │<──────────────────│                 │
     │               │                │                   │                 │
     │ 12. Settlement Response + Access Proof             │                 │
     │<───────────────────────────────│                   │                 │
     │               │                │                   │                 │
```

### Step Details

#### Step 1-2: Get Paywall Info

```bash
# Frontend requests paywall details
GET /paywalls/0x<paywall_id>
```

**Response**:
```json
{
  "id": "0x...",
  "creator": "0x...",
  "price": "1000000000000000000",
  "priceFormatted": "1.0",
  "active": true,
  "x402Enabled": true
}
```

#### Step 3-4: Create Payment Intent

The facilitator generates EIP-712 typed data for signing.

**Request**:
```bash
POST /verify
Content-Type: application/json

{
  "paymentRequirements": {
    "scheme": "exact",
    "network": "eip155:11155111",
    "maxAmountRequired": "1000000000000000000",
    "resource": "paywall:0x<paywall_id>",
    "payTo": "0x<creator_address>",
    "maxTimeoutSeconds": 3600,
    "asset": "0xF730d47c3003eCaE2608C452BCD5b0edf825e51C"
  }
}
```

**EIP-712 Typed Data Structure**:
```typescript
const domain = {
  name: "TwinkleX402",
  version: "2",
  chainId: 11155111,
  verifyingContract: "0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3"
};

const types = {
  PaymentIntent: [
    { name: "payer", type: "address" },
    { name: "requestId", type: "bytes32" },
    { name: "amount", type: "uint256" },
    { name: "validUntil", type: "uint256" },
    { name: "nonce", type: "uint256" }
  ]
};

const message = {
  payer: "0x<user_address>",
  requestId: "0x<request_id>",
  amount: "1000000000000000000",
  validUntil: "1736600000",
  nonce: "1"
};
```

#### Step 5: User Signs

Frontend uses wallet to sign typed data:

```typescript
// Using ethers.js v6
const signature = await signer.signTypedData(domain, types, message);

// Using viem
const signature = await walletClient.signTypedData({
  domain,
  types,
  primaryType: 'PaymentIntent',
  message
});
```

#### Step 6-11: Settlement

**Request**:
```bash
POST /settle
Content-Type: application/json

{
  "paymentPayload": {
    "x402Version": 1,
    "scheme": "exact",
    "network": "eip155:11155111",
    "payload": {
      "signature": "0x<user_signature>",
      "authorization": {
        "payer": "0x<user_address>",
        "requestId": "0x<request_id>",
        "amount": "1000000000000000000",
        "validUntil": "1736600000",
        "nonce": "1"
      }
    }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "eip155:11155111",
    "maxAmountRequired": "1000000000000000000",
    "resource": "paywall:0x<paywall_id>",
    "payTo": "0x<creator_address>",
    "maxTimeoutSeconds": 3600,
    "asset": "0xF730d47c3003eCaE2608C452BCD5b0edf825e51C"
  }
}
```

**Response**:
```json
{
  "success": true,
  "txHash": "0x...",
  "accessProofId": "0x...",
  "message": "Payment settled successfully"
}
```

---

## 2. Subscription Flow

Recurring payment subscriptions.

### Sequence Diagram

```
┌──────────┐    ┌──────────┐    ┌────────────────────┐
│  Frontend│    │   API    │    │TwinkleSubscription │
└────┬─────┘    └────┬─────┘    └─────────┬──────────┘
     │               │                     │
     │ 1. Get Plan   │                     │
     │──────────────>│                     │
     │               │                     │
     │ 2. Plan Details                     │
     │<──────────────│                     │
     │               │                     │
     │ 3. Subscribe (Contract Call)        │
     │────────────────────────────────────>│
     │               │                     │
     │               │                     │ 4. Create Subscription
     │               │                     │ 5. Transfer First Payment
     │               │                     │ 6. Emit SubscriptionCreated
     │               │                     │
     │ 7. Subscription Confirmed           │
     │<────────────────────────────────────│
     │               │                     │
     │ 8. Check Subscription Status        │
     │──────────────>│                     │
     │               │                     │
     │ 9. Subscription Active              │
     │<──────────────│                     │
```

### Step Details

#### Get Plan Info

```bash
GET /subscriptions/plans/0x<plan_id>
```

**Response**:
```json
{
  "id": "0x...",
  "creator": "0x...",
  "price": "10000000000000000000",
  "priceFormatted": "10.0",
  "intervalDays": 30,
  "trialDays": 7,
  "active": true
}
```

#### Subscribe (Direct Contract Call)

```typescript
// Using ethers.js
const contract = new ethers.Contract(
  TWINKLE_SUBSCRIPTION_ADDRESS,
  TwinkleSubscriptionABI,
  signer
);

// Approve MNEE spending first
const mnee = new ethers.Contract(MNEE_ADDRESS, ERC20_ABI, signer);
await mnee.approve(TWINKLE_SUBSCRIPTION_ADDRESS, planPrice);

// Subscribe
const tx = await contract.subscribe(planId);
await tx.wait();
```

#### Check Status via API or MCP

```bash
# Via API
GET /subscriptions/user/0x<user_address>

# Via MCP Tool
twinkle_check_subscription({ planId: "0x...", userAddress: "0x..." })
```

---

## 3. Escrow Project Flow

Multi-milestone escrow for freelance projects.

### Sequence Diagram

```
┌────────┐    ┌────────────┐    ┌──────────────┐
│ Client │    │ Freelancer │    │TwinkleEscrow │
└───┬────┘    └─────┬──────┘    └──────┬───────┘
    │               │                   │
    │ 1. Create Project with Milestones │
    │──────────────────────────────────>│
    │               │                   │
    │ 2. Fund Project (Deposit MNEE)    │
    │──────────────────────────────────>│
    │               │                   │
    │               │ 3. Accept Project │
    │               │──────────────────>│
    │               │                   │
    │               │ 4. Complete MS 1  │
    │               │──────────────────>│
    │               │                   │
    │ 5. Approve Milestone 1            │
    │──────────────────────────────────>│
    │               │                   │
    │               │ 6. MNEE Released  │
    │               │<──────────────────│
    │               │                   │
    │    ... Repeat for each milestone  │
    │               │                   │
    │ 7. Complete Project               │
    │──────────────────────────────────>│
```

### Status Codes

| Status | Value | Description |
|--------|-------|-------------|
| Created | 0 | Project created, awaiting funding |
| Funded | 1 | Client has deposited funds |
| InProgress | 2 | Freelancer has accepted |
| Completed | 3 | All milestones approved |
| Disputed | 4 | Dispute raised |
| Cancelled | 5 | Project cancelled |

### API Endpoints

```bash
# Get project with milestones
GET /projects/0x<project_id>

# Get milestones only
GET /projects/0x<project_id>/milestones

# Get dispute if any
GET /projects/0x<project_id>/dispute
```

---

## 4. Revenue Split Flow

Automatic revenue distribution to multiple recipients.

### Sequence Diagram

```
┌─────────┐    ┌───────────┐    ┌────────────┐
│  Payer  │    │TwinkleSplit│    │ Recipients │
└────┬────┘    └─────┬─────┘    └─────┬──────┘
     │               │                 │
     │ 1. Pay to Split Address         │
     │──────────────>│                 │
     │               │                 │
     │               │ 2. Calculate Shares
     │               │                 │
     │               │ 3. Distribute   │
     │               │────────────────>│
     │               │ (Each recipient │
     │               │  gets their %)  │
```

### Split Configuration

```json
{
  "id": "0x...",
  "creator": "0x...",
  "recipients": [
    { "address": "0xA...", "share": 5000 },  // 50%
    { "address": "0xB...", "share": 3000 },  // 30%
    { "address": "0xC...", "share": 2000 }   // 20%
  ],
  "totalShares": 10000  // Base: 100% = 10000
}
```

### API Endpoints

```bash
# Get split with recipients
GET /splits/0x<split_id>

# Get distribution history
GET /splits/0x<split_id>/distributions

# Get withdrawal history
GET /splits/0x<split_id>/withdrawals
```

---

## 5. Access Proof Verification

After payment, verify access with proof.

### Flow

```
┌──────────┐    ┌──────────┐    ┌────────────┐
│  Frontend│    │   API    │    │TwinkleX402 │
└────┬─────┘    └────┬─────┘    └─────┬──────┘
     │               │                 │
     │ 1. Store accessProofId locally  │
     │               │                 │
     │ 2. Verify Access                │
     │──────────────>│                 │
     │               │ 3. Check proof  │
     │               │────────────────>│
     │               │                 │
     │ 4. Valid/Invalid                │
     │<──────────────│                 │
```

### API Endpoint

```bash
GET /x402/access-proofs/0x<proof_id>
```

**Response**:
```json
{
  "id": "0x...",
  "paywallId": "0x...",
  "user": "0x...",
  "valid": true,
  "expiresAt": "2024-01-18T10:30:00.000Z"
}
```

---

## Smart Contract Events

The indexer listens for these events:

### TwinklePay

| Event | Description |
|-------|-------------|
| `PaywallCreated` | New paywall created |
| `PaywallUnlocked` | User unlocked paywall |
| `PaywallUpdated` | Paywall settings changed |

### TwinkleX402

| Event | Description |
|-------|-------------|
| `PaymentRequestCreated` | New payment request |
| `PaymentSettled` | Payment executed |
| `AccessGranted` | Access proof issued |

### TwinkleSubscription

| Event | Description |
|-------|-------------|
| `PlanCreated` | New subscription plan |
| `SubscriptionCreated` | User subscribed |
| `SubscriptionRenewed` | Subscription renewed |
| `SubscriptionCancelled` | Subscription cancelled |

### TwinkleEscrow

| Event | Description |
|-------|-------------|
| `ProjectCreated` | New escrow project |
| `ProjectFunded` | Project funded |
| `MilestoneCompleted` | Milestone marked complete |
| `MilestoneApproved` | Milestone approved, funds released |
| `DisputeRaised` | Project disputed |

### TwinkleSplit

| Event | Description |
|-------|-------------|
| `SplitCreated` | New split created |
| `FundsDistributed` | Funds distributed to recipients |
| `FundsWithdrawn` | Recipient withdrew funds |

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `InsufficientBalance` | User doesn't have enough MNEE | Check balance first |
| `InvalidSignature` | Signature doesn't match | Verify signing parameters |
| `ExpiredPayment` | `validUntil` timestamp passed | Create new payment intent |
| `AlreadyUnlocked` | User already has access | Check unlock status first |
| `NonceAlreadyUsed` | Replay attack prevented | Generate new nonce |

### Retry Strategy

For settlement failures:
1. Wait 5 seconds
2. Retry with same payload
3. If still failing, check RPC connectivity
4. Check facilitator wallet has ETH for gas
