#!/usr/bin/env npx tsx
/**
 * Demo: Paywall Lifecycle
 * Complete flow for creating and using paywalls
 *
 * Run: npx tsx demo-paywall-flow.ts
 */

import { parseEther, formatEther } from 'viem';
import { CONFIG } from './lib/config.js';
import {
  createPublicClientInstance,
  createWalletClientInstance,
  getAccount,
  logWalletInfo,
  approveMnee,
  getMneeAllowance,
} from './lib/wallet.js';
import {
  createPaywall,
  payForPaywall,
  getPaywallOnChain,
  isPaywallUnlocked,
  generatePaywallId,
} from './lib/contracts.js';
import { api } from './lib/api.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Twinkle Protocol - Paywall Flow Demo');
  console.log('='.repeat(60));
  console.log(`Chain: Sepolia (${CONFIG.chainId})`);
  console.log(`TwinklePay: ${CONFIG.contracts.TwinklePay}\n`);

  // Setup clients
  const publicClient = createPublicClientInstance();
  const walletClient = createWalletClientInstance();
  const account = getAccount();

  console.log('--- Wallet Info ---');
  await logWalletInfo(publicClient, account.address);

  // ===== STEP 1: Check existing paywalls =====
  console.log('\n--- Step 1: Checking Existing Paywalls ---');

  const existingPaywalls = await api.getPaywalls({ creator: account.address });
  console.log(`Existing paywalls by creator: ${existingPaywalls.length}`);

  if (existingPaywalls.length > 0) {
    console.log('\nFirst existing paywall:');
    const p = existingPaywalls[0];
    console.log(`  ID: ${p.id}`);
    console.log(`  Price: ${formatEther(BigInt(p.price))} tMNEE`);
    console.log(`  Active: ${p.active}`);
    console.log(`  Unlocks: ${p.totalUnlocks}`);
  }

  // ===== STEP 2: Create a new paywall =====
  console.log('\n--- Step 2: Creating New Paywall ---');

  const contentId = `demo-content-${Date.now()}`;
  const paywallPrice = parseEther('5'); // 5 tMNEE

  console.log('Paywall parameters:');
  console.log(`  Content ID: ${contentId}`);
  console.log(`  Price: ${formatEther(paywallPrice)} tMNEE`);
  console.log(`  x402 Enabled: true`);

  // Generate the paywall ID
  const paywallId = generatePaywallId(account.address, contentId);
  console.log(`  Generated ID: ${paywallId}`);

  // Create paywall on-chain
  console.log('\nSending createPaywall transaction...');
  try {
    const { hash, paywallId: createdId } = await createPaywall(
      walletClient,
      publicClient,
      {
        contentId,
        price: paywallPrice,
        x402Enabled: true,
      }
    );
    console.log(`Transaction hash: ${hash}`);
    console.log(`Paywall created: ${createdId}`);

    // Wait for indexer
    console.log('\nWaiting for indexer (3s)...');
    await new Promise((r) => setTimeout(r, 3000));

    // ===== STEP 3: Verify via API =====
    console.log('\n--- Step 3: Verifying via API ---');

    const apiPaywall = await api.getPaywall(createdId);
    if (apiPaywall) {
      console.log('Paywall from API:');
      console.log(`  Creator: ${apiPaywall.creator}`);
      console.log(`  Price: ${formatEther(BigInt(apiPaywall.price))} tMNEE`);
      console.log(`  Active: ${apiPaywall.active}`);
      console.log(`  x402 Enabled: ${apiPaywall.x402Enabled}`);
    } else {
      console.log('Paywall not yet indexed (may take longer)');
    }

    // ===== STEP 4: Check unlock status =====
    console.log('\n--- Step 4: Checking Unlock Status ---');

    const isUnlocked = await isPaywallUnlocked(
      publicClient,
      createdId,
      account.address
    );
    console.log(`User unlocked (on-chain): ${isUnlocked}`);

    const unlockStatus = await api.checkUnlock(createdId, account.address);
    console.log(`User unlocked (API): ${unlockStatus.unlocked}`);

    // ===== STEP 5: Pay to unlock =====
    console.log('\n--- Step 5: Paying to Unlock ---');

    // Ensure allowance
    const allowance = await getMneeAllowance(
      publicClient,
      account.address,
      CONFIG.contracts.TwinklePay
    );

    if (allowance < paywallPrice) {
      console.log('Approving MNEE...');
      await approveMnee(
        walletClient,
        publicClient,
        CONFIG.contracts.TwinklePay,
        parseEther('1000')
      );
    }

    if (!isUnlocked) {
      console.log('Sending payment transaction...');
      const payHash = await payForPaywall(walletClient, publicClient, createdId);
      console.log(`Payment TX: ${payHash}`);

      // Wait for indexer
      console.log('\nWaiting for indexer (3s)...');
      await new Promise((r) => setTimeout(r, 3000));

      // ===== STEP 6: Verify unlock =====
      console.log('\n--- Step 6: Verifying Unlock ---');

      const isNowUnlocked = await isPaywallUnlocked(
        publicClient,
        createdId,
        account.address
      );
      console.log(`User now unlocked (on-chain): ${isNowUnlocked}`);

      const newUnlockStatus = await api.checkUnlock(createdId, account.address);
      console.log(`User now unlocked (API): ${newUnlockStatus.unlocked}`);

      // Get updated paywall stats
      const updatedPaywall = await getPaywallOnChain(publicClient, createdId);
      console.log('\nUpdated paywall stats:');
      console.log(`  Total Unlocks: ${updatedPaywall.totalUnlocks}`);
      console.log(`  Total Revenue: ${formatEther(updatedPaywall.totalRevenue)} tMNEE`);
    } else {
      console.log('User already unlocked, skipping payment');
    }
  } catch (error: any) {
    if (error.message?.includes('IdExists')) {
      console.log('Paywall ID already exists (this is fine for demo)');
    } else {
      throw error;
    }
  }

  // ===== Summary =====
  console.log('\n' + '='.repeat(60));
  console.log('Paywall Flow Demo Complete!');
  console.log('='.repeat(60));
  console.log('\nPaywall lifecycle:');
  console.log('1. Creator calls createPaywall() with price and settings');
  console.log('2. Paywall is indexed by Ponder and available via API');
  console.log('3. User calls pay() to unlock content');
  console.log('4. Revenue goes to creator (minus platform fee)');
  console.log('5. User can verify unlock status on-chain or via API');
}

main().catch(console.error);
