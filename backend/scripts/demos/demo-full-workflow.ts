#!/usr/bin/env npx tsx
/**
 * Demo: Full Twinkle Protocol Workflow
 * End-to-end demonstration of all protocol features
 *
 * Run: npx tsx demo-full-workflow.ts
 */

import { parseEther, formatEther, keccak256, encodePacked } from 'viem';
import { CONFIG } from './lib/config.js';
import {
  createPublicClientInstance,
  createWalletClientInstance,
  getAccount,
  logWalletInfo,
  approveMnee,
  getMneeBalance,
} from './lib/wallet.js';
import {
  generatePaywallId,
  createPaywall,
  payForPaywall,
  isPaywallUnlocked,
} from './lib/contracts.js';
import {
  signPaymentIntent,
  createPaymentIntent,
  generateNonce,
} from './lib/eip712.js';
import { api } from './lib/api.js';

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('='.repeat(70));
  console.log('      TWINKLE PROTOCOL - FULL WORKFLOW DEMONSTRATION');
  console.log('='.repeat(70));
  console.log(`\nChain: Sepolia (${CONFIG.chainId})`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // Setup
  const publicClient = createPublicClientInstance();
  const walletClient = createWalletClientInstance();
  const account = getAccount();

  // ===== PHASE 1: Setup & Balances =====
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 1: SETUP & BALANCE CHECK');
  console.log('='.repeat(70));

  console.log('\n--- Wallet Configuration ---');
  console.log(`Address: ${account.address}`);
  await logWalletInfo(publicClient, account.address);

  // Approve all contracts
  console.log('\n--- Approving MNEE for all contracts ---');
  const approvalAmount = parseEther('10000');

  for (const [name, address] of Object.entries({
    TwinklePay: CONFIG.contracts.TwinklePay,
    TwinkleX402: CONFIG.contracts.TwinkleX402,
    TwinkleSubscription: CONFIG.contracts.TwinkleSubscription,
    TwinkleSplit: CONFIG.contracts.TwinkleSplit,
    TwinkleEscrow: CONFIG.contracts.TwinkleEscrow,
  })) {
    try {
      await approveMnee(walletClient, publicClient, address as `0x${string}`, approvalAmount);
      console.log(`  ✓ ${name} approved`);
    } catch (e: any) {
      console.log(`  - ${name}: ${e.message?.includes('already') ? 'already approved' : 'skipped'}`);
    }
  }

  // ===== PHASE 2: Paywall Creation & Payment =====
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 2: PAYWALL CREATION & PAYMENT');
  console.log('='.repeat(70));

  const contentId = `full-demo-${Date.now()}`;
  const paywallPrice = parseEther('2');
  const paywallId = generatePaywallId(account.address, contentId);

  console.log('\n--- Creating Paywall ---');
  console.log(`Content ID: ${contentId}`);
  console.log(`Price: ${formatEther(paywallPrice)} tMNEE`);

  try {
    const { hash } = await createPaywall(walletClient, publicClient, {
      contentId,
      price: paywallPrice,
      x402Enabled: true,
    });
    console.log(`✓ Paywall created: ${hash.slice(0, 18)}...`);
    console.log(`  ID: ${paywallId}`);
  } catch (e: any) {
    if (e.message?.includes('IdExists')) {
      console.log('  Paywall already exists (continuing...)');
    } else {
      throw e;
    }
  }

  await sleep(2000);

  // Check unlock status and pay
  const isUnlocked = await isPaywallUnlocked(publicClient, paywallId, account.address);
  if (!isUnlocked) {
    console.log('\n--- Paying for Paywall ---');
    const payHash = await payForPaywall(walletClient, publicClient, paywallId);
    console.log(`✓ Payment sent: ${payHash.slice(0, 18)}...`);
  } else {
    console.log('\n--- Paywall Already Unlocked ---');
  }

  // ===== PHASE 3: x402 Payment Flow =====
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 3: x402 AI AGENT PAYMENT FLOW');
  console.log('='.repeat(70));

  console.log('\n--- Simulating x402 Payment ---');

  // Generate payment intent
  const nonce = generateNonce();
  const requestId = keccak256(
    encodePacked(['address', 'bytes32', 'uint256'], [account.address, paywallId, nonce])
  );

  const intent = createPaymentIntent({
    payer: account.address,
    requestId,
    amount: paywallPrice,
    nonce,
  });

  console.log('Payment Intent:');
  console.log(`  Payer: ${intent.payer}`);
  console.log(`  Amount: ${formatEther(intent.amount)} tMNEE`);
  console.log(`  Nonce: ${intent.nonce.toString().slice(0, 10)}...`);

  // Sign the intent
  const signature = await signPaymentIntent(walletClient, intent);
  console.log(`✓ EIP-712 Signature: ${signature.slice(0, 18)}...`);

  console.log('\n--- x402 Protocol Flow ---');
  console.log('1. [CLIENT] Request protected resource');
  console.log('2. [SERVER] Return 402 with payment requirements');
  console.log('3. [CLIENT] Sign EIP-712 PaymentIntent');
  console.log('4. [CLIENT] Retry with X-PAYMENT header');
  console.log('5. [FACILITATOR] Verify signature & settle on-chain');
  console.log('6. [SERVER] Verify access proof & serve content');
  console.log('✓ Flow complete (simulated)');

  // ===== PHASE 4: API Verification =====
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 4: API VERIFICATION');
  console.log('='.repeat(70));

  console.log('\n--- Querying API ---');
  await sleep(2000);

  const health = await api.health();
  console.log(`API Health: ${health.status}`);

  const paywalls = await api.getPaywalls({ creator: account.address, limit: 3 });
  console.log(`\nPaywalls by creator: ${paywalls.length}`);
  paywalls.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.id.slice(0, 18)}... - ${formatEther(BigInt(p.price))} tMNEE`);
  });

  const plans = await api.getPlans({ limit: 3 });
  console.log(`\nSubscription plans: ${plans.length}`);

  const projects = await api.getProjects({ limit: 3 });
  console.log(`Escrow projects: ${projects.length}`);

  const splits = await api.getSplits({ limit: 3 });
  console.log(`Revenue splits: ${splits.length}`);

  // ===== PHASE 5: Analytics Overview =====
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 5: ANALYTICS OVERVIEW');
  console.log('='.repeat(70));

  try {
    const analytics = await api.getAnalyticsOverview();
    console.log('\n--- Protocol Analytics ---');
    console.log(`Total Payments: ${analytics.totalPayments}`);
    console.log(`Total Volume: ${analytics.totalVolume} wei`);
    console.log(`Active Paywalls: ${analytics.activePaywalls}`);
    console.log(`Active Subscriptions: ${analytics.activeSubscriptions}`);
    console.log(`Total Users: ${analytics.totalUsers}`);
  } catch {
    console.log('\nAnalytics endpoint not available');
  }

  // ===== PHASE 6: Final Balance =====
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 6: FINAL BALANCE CHECK');
  console.log('='.repeat(70));

  const finalBalance = await getMneeBalance(publicClient, account.address);
  console.log(`\nFinal MNEE Balance: ${finalBalance} tMNEE`);

  // ===== SUMMARY =====
  console.log('\n' + '='.repeat(70));
  console.log('                    WORKFLOW COMPLETE');
  console.log('='.repeat(70));

  console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│                     TWINKLE PROTOCOL FEATURES                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PAYWALLS                                                           │
│  ├── Create content paywalls with custom pricing                   │
│  ├── Support for x402 AI agent payments                            │
│  ├── Revenue splits for collaborations                             │
│  └── Unlock verification on-chain                                  │
│                                                                     │
│  x402 PROTOCOL                                                      │
│  ├── EIP-712 signed payment authorizations                         │
│  ├── Off-chain signing (no gas for payers)                         │
│  ├── Facilitator handles on-chain settlement                       │
│  └── Access proofs for content verification                        │
│                                                                     │
│  SUBSCRIPTIONS                                                      │
│  ├── Recurring payment plans                                       │
│  ├── Configurable intervals and grace periods                      │
│  └── Automatic renewal tracking                                    │
│                                                                     │
│  ESCROW                                                             │
│  ├── Milestone-based project funding                               │
│  ├── Sablier streaming integration                                 │
│  └── Dispute resolution                                            │
│                                                                     │
│  SPLITS                                                             │
│  ├── Revenue distribution to multiple recipients                   │
│  ├── Configurable share percentages                                │
│  └── Integration with paywalls                                     │
│                                                                     │
│  MCP SERVER                                                         │
│  ├── 8 tools for AI agent integration                              │
│  ├── Balance and access checks                                     │
│  └── Payment intent generation                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Contract Addresses (Sepolia):
  TestMNEE:           ${CONFIG.contracts.TestMNEE}
  TwinklePay:         ${CONFIG.contracts.TwinklePay}
  TwinkleX402:        ${CONFIG.contracts.TwinkleX402}
  TwinkleSubscription: ${CONFIG.contracts.TwinkleSubscription}
  TwinkleEscrow:      ${CONFIG.contracts.TwinkleEscrow}
  TwinkleSplit:       ${CONFIG.contracts.TwinkleSplit}

For more information:
  - Run individual demos: npx tsx demo-*.ts
  - API Documentation: http://localhost:3000/docs
  - x402 Protocol: https://x402.org
`);
}

main().catch(console.error);
