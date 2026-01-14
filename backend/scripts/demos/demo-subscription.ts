#!/usr/bin/env npx tsx
/**
 * Demo: Subscription Lifecycle
 * Complete flow for subscription plans and user subscriptions
 *
 * Run: npx tsx demo-subscription.ts
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
  createSubscriptionPlan,
  subscribeToPlan,
  isSubscribedToPlan,
} from './lib/contracts.js';
import { api } from './lib/api.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Twinkle - Subscription Demo');
  console.log('='.repeat(60));
  console.log(`Chain: ${CONFIG.chainName} (${CONFIG.chainId})`);
  console.log(`TwinkleSubscription: ${CONFIG.contracts.TwinkleSubscription}\n`);

  // Setup clients
  const publicClient = createPublicClientInstance();
  const walletClient = createWalletClientInstance();
  const account = getAccount();

  console.log('--- Wallet Info ---');
  await logWalletInfo(publicClient, account.address);

  // ===== STEP 1: Check existing plans =====
  console.log('\n--- Step 1: Checking Existing Plans ---');

  const existingPlans = await api.getPlans({ limit: 5 });
  console.log(`Total plans in system: ${existingPlans.length}`);

  if (existingPlans.length > 0) {
    console.log('\nExisting plans:');
    existingPlans.forEach((plan, i) => {
      console.log(`  ${i + 1}. ID: ${plan.id.slice(0, 18)}...`);
      console.log(`     Price: ${formatEther(BigInt(plan.price))} tMNEE`);
      console.log(`     Interval: ${plan.interval}s (${plan.interval / 86400} days)`);
      console.log(`     Subscribers: ${plan.totalSubscribers}`);
    });
  }

  // ===== STEP 2: Create subscription plan =====
  console.log('\n--- Step 2: Creating Subscription Plan ---');

  const planPrice = parseEther('2'); // 2 tMNEE per period
  const interval = 2592000; // 30 days in seconds
  const gracePeriod = 86400; // 1 day grace period

  console.log('Plan parameters:');
  console.log(`  Price: ${formatEther(planPrice)} tMNEE`);
  console.log(`  Interval: ${interval}s (${interval / 86400} days)`);
  console.log(`  Grace Period: ${gracePeriod}s (${gracePeriod / 86400} days)`);

  try {
    console.log('\nSending createPlan transaction...');
    const { hash: planHash, planId } = await createSubscriptionPlan(
      walletClient,
      publicClient,
      {
        price: planPrice,
        interval,
        gracePeriod,
      }
    );
    console.log(`Transaction hash: ${planHash}`);
    console.log(`Plan ID: ${planId}`);

    // Wait for indexer
    console.log('\nWaiting for indexer (3s)...');
    await new Promise((r) => setTimeout(r, 3000));

    // ===== STEP 3: Verify via API =====
    console.log('\n--- Step 3: Verifying via API ---');

    const apiPlan = await api.getPlan(planId);
    if (apiPlan) {
      console.log('Plan from API:');
      console.log(`  Creator: ${apiPlan.creator}`);
      console.log(`  Price: ${formatEther(BigInt(apiPlan.price))} tMNEE`);
      console.log(`  Interval: ${apiPlan.interval}s`);
      console.log(`  Active: ${apiPlan.active}`);
    } else {
      console.log('Plan not yet indexed');
    }

    // ===== STEP 4: Subscribe to plan =====
    console.log('\n--- Step 4: Subscribing to Plan ---');

    // Check if already subscribed
    const alreadySubscribed = await isSubscribedToPlan(
      publicClient,
      planId,
      account.address
    );

    if (alreadySubscribed) {
      console.log('User is already subscribed to this plan');
    } else {
      // Ensure allowance
      const allowance = await getMneeAllowance(
        publicClient,
        account.address,
        CONFIG.contracts.TwinkleSubscription
      );

      if (allowance < planPrice) {
        console.log('Approving MNEE...');
        await approveMnee(
          walletClient,
          publicClient,
          CONFIG.contracts.TwinkleSubscription,
          parseEther('1000')
        );
      }

      console.log('Sending subscribe transaction...');
      const subHash = await subscribeToPlan(walletClient, publicClient, planId);
      console.log(`Subscribe TX: ${subHash}`);

      // Wait for indexer
      console.log('\nWaiting for indexer (3s)...');
      await new Promise((r) => setTimeout(r, 3000));
    }

    // ===== STEP 5: Verify subscription =====
    console.log('\n--- Step 5: Verifying Subscription ---');

    const isNowSubscribed = await isSubscribedToPlan(
      publicClient,
      planId,
      account.address
    );
    console.log(`Subscribed (on-chain): ${isNowSubscribed}`);

    const subStatus = await api.checkSubscription(planId, account.address);
    console.log(`Subscribed (API): ${subStatus.active}`);
    if (subStatus.expiresAt) {
      console.log(`Expires: ${subStatus.expiresAt}`);
    }

    // Get user subscriptions
    const userSubs = await api.getUserSubscriptions(account.address);
    console.log(`\nTotal user subscriptions: ${userSubs.length}`);
  } catch (error: any) {
    console.log('Transaction error:', error.message?.slice(0, 100) || error);
  }

  // ===== STEP 6: List user subscriptions =====
  console.log('\n--- Step 6: User Subscriptions ---');

  const subscriptions = await api.getUserSubscriptions(account.address);
  if (subscriptions.length > 0) {
    console.log('Active subscriptions:');
    subscriptions.forEach((sub, i) => {
      console.log(`  ${i + 1}. Plan: ${sub.planId.slice(0, 18)}...`);
      console.log(`     Active: ${sub.active}`);
      console.log(`     Expires: ${sub.expiresAt}`);
    });
  } else {
    console.log('No active subscriptions found');
  }

  // ===== Summary =====
  console.log('\n' + '='.repeat(60));
  console.log('Subscription Demo Complete!');
  console.log('='.repeat(60));
  console.log('\nSubscription lifecycle:');
  console.log('1. Creator calls createPlan() with price and interval');
  console.log('2. Users call subscribe() to start subscription');
  console.log('3. Payment is taken immediately and on each renewal');
  console.log('4. Subscription status is verifiable on-chain');
  console.log('5. Grace period allows for payment delays');
}

main().catch(console.error);
