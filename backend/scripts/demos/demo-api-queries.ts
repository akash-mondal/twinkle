#!/usr/bin/env npx tsx
/**
 * Demo: API Queries
 * Demonstrates querying all REST API endpoints
 *
 * Run: npx tsx demo-api-queries.ts
 */

import { api } from './lib/api.js';
import { CONFIG } from './lib/config.js';

const DEPLOYER = '0x61D3bbc2f8fF4f2292ea485Ef9E39560D7DB8465';

async function main() {
  console.log('='.repeat(60));
  console.log('Twinkle Protocol - API Queries Demo');
  console.log('='.repeat(60));
  console.log(`API URL: ${CONFIG.apiUrl}\n`);

  // ===== Health Check =====
  console.log('\n--- Health Check ---');
  try {
    const health = await api.health();
    console.log('Status:', health.status);
    console.log('Redis:', health.checks.redis.status);
    console.log('Database:', health.checks.database.status);
  } catch (error) {
    console.error('Health check failed:', error);
    console.log('\nMake sure the API is running: pnpm --filter @twinkle/api dev');
    process.exit(1);
  }

  // ===== Paywalls =====
  console.log('\n--- Paywalls ---');
  try {
    const paywalls = await api.getPaywalls({ limit: 5 });
    console.log(`Total paywalls found: ${paywalls.length}`);

    if (paywalls.length > 0) {
      console.log('\nFirst paywall:');
      const p = paywalls[0];
      console.log(`  ID: ${p.id}`);
      console.log(`  Creator: ${p.creator}`);
      console.log(`  Price: ${p.price} wei`);
      console.log(`  Active: ${p.active}`);
      console.log(`  x402 Enabled: ${p.x402Enabled}`);
      console.log(`  Total Unlocks: ${p.totalUnlocks}`);

      // Check unlock status
      const unlockStatus = await api.checkUnlock(p.id, DEPLOYER);
      console.log(`  Deployer Unlocked: ${unlockStatus.unlocked}`);
    }

    // Filter by creator
    const creatorPaywalls = await api.getPaywalls({ creator: DEPLOYER });
    console.log(`\nPaywalls by deployer: ${creatorPaywalls.length}`);
  } catch (error) {
    console.error('Paywall query failed:', error);
  }

  // ===== Subscriptions =====
  console.log('\n--- Subscription Plans ---');
  try {
    const plans = await api.getPlans({ limit: 5 });
    console.log(`Total plans found: ${plans.length}`);

    if (plans.length > 0) {
      console.log('\nFirst plan:');
      const plan = plans[0];
      console.log(`  ID: ${plan.id}`);
      console.log(`  Creator: ${plan.creator}`);
      console.log(`  Price: ${plan.price} wei`);
      console.log(`  Interval: ${plan.interval}s`);
      console.log(`  Active: ${plan.active}`);
      console.log(`  Subscribers: ${plan.totalSubscribers}`);

      // Check subscription status
      const subStatus = await api.checkSubscription(plan.id, DEPLOYER);
      console.log(`  Deployer Subscribed: ${subStatus.active}`);
    }

    // Get user subscriptions
    const userSubs = await api.getUserSubscriptions(DEPLOYER);
    console.log(`\nDeployer subscriptions: ${userSubs.length}`);
  } catch (error) {
    console.error('Subscription query failed:', error);
  }

  // ===== Projects (Escrow) =====
  console.log('\n--- Projects (Escrow) ---');
  try {
    const projects = await api.getProjects({ limit: 5 });
    console.log(`Total projects found: ${projects.length}`);

    if (projects.length > 0) {
      console.log('\nFirst project:');
      const proj = projects[0];
      console.log(`  ID: ${proj.id}`);
      console.log(`  Client: ${proj.client}`);
      console.log(`  Freelancer: ${proj.freelancer}`);
      console.log(`  Budget: ${proj.totalBudget} wei`);
      console.log(`  Released: ${proj.released} wei`);
      console.log(`  Status: ${proj.status}`);
      console.log(`  Milestones: ${proj.milestones?.length || 0}`);
    }

    // Filter by client
    const clientProjects = await api.getProjects({ client: DEPLOYER });
    console.log(`\nProjects as client: ${clientProjects.length}`);
  } catch (error) {
    console.error('Project query failed:', error);
  }

  // ===== Splits =====
  console.log('\n--- Revenue Splits ---');
  try {
    const splits = await api.getSplits({ limit: 5 });
    console.log(`Total splits found: ${splits.length}`);

    if (splits.length > 0) {
      console.log('\nFirst split:');
      const split = splits[0];
      console.log(`  ID: ${split.id}`);
      console.log(`  Creator: ${split.creator}`);
      console.log(`  Recipients: ${split.recipients?.length || 0}`);
      console.log(`  Total Deposited: ${split.totalDeposited} wei`);
      console.log(`  Total Distributed: ${split.totalDistributed} wei`);
    }
  } catch (error) {
    console.error('Split query failed:', error);
  }

  // ===== X402 Requests =====
  console.log('\n--- X402 Payment Requests ---');
  try {
    const requests = await api.getX402Requests({ limit: 5 });
    console.log(`Total requests found: ${requests.length}`);

    if (requests.length > 0) {
      console.log('\nFirst request:');
      const req = requests[0];
      console.log(`  Request ID: ${req.requestId}`);
      console.log(`  Pay To: ${req.payTo}`);
      console.log(`  Amount: ${req.amount} wei`);
      console.log(`  Paywall ID: ${req.paywallId}`);
      console.log(`  Settled: ${req.settled}`);
      console.log(`  Valid Until: ${req.validUntil}`);
    }

    // Get settlements
    const settlements = await api.getX402Settlements({ limit: 5 });
    console.log(`\nTotal settlements: ${settlements.length}`);

    if (settlements.length > 0) {
      console.log('\nFirst settlement:');
      const s = settlements[0];
      console.log(`  Request ID: ${s.requestId}`);
      console.log(`  Payer: ${s.payer}`);
      console.log(`  Amount: ${s.amount} wei`);
      console.log(`  Access Proof: ${s.accessProofId}`);
    }
  } catch (error) {
    console.error('X402 query failed:', error);
  }

  // ===== Payments =====
  console.log('\n--- Payments ---');
  try {
    const payments = await api.getPayments({ limit: 5 });
    console.log(`Total payments found: ${payments.length}`);

    if (payments.length > 0) {
      console.log('\nFirst payment:');
      console.log(JSON.stringify(payments[0], null, 2));
    }
  } catch (error) {
    console.error('Payment query failed:', error);
  }

  // ===== Analytics =====
  console.log('\n--- Analytics ---');
  try {
    const overview = await api.getAnalyticsOverview();
    console.log('Overview:');
    console.log(`  Total Payments: ${overview.totalPayments}`);
    console.log(`  Total Volume: ${overview.totalVolume} wei`);
    console.log(`  Active Paywalls: ${overview.activePaywalls}`);
    console.log(`  Active Subscriptions: ${overview.activeSubscriptions}`);
    console.log(`  Total Users: ${overview.totalUsers}`);

    const daily = await api.getDailyAnalytics();
    console.log(`\nDaily analytics entries: ${daily.length}`);

    if (daily.length > 0) {
      console.log('\nLatest day:');
      const d = daily[0];
      console.log(`  Date: ${d.date}`);
      console.log(`  Payments: ${d.payments}`);
      console.log(`  Volume: ${d.volume} wei`);
    }
  } catch (error) {
    console.error('Analytics query failed:', error);
  }

  // ===== Metrics =====
  console.log('\n--- Prometheus Metrics ---');
  try {
    const metrics = await api.metrics();
    const lines = metrics.split('\n').filter(l => !l.startsWith('#')).slice(0, 10);
    console.log('Sample metrics:');
    lines.forEach(l => console.log(`  ${l}`));
    console.log('  ...');
  } catch (error) {
    console.error('Metrics query failed:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('API Queries Demo Complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);
