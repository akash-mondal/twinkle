#!/usr/bin/env npx tsx
/**
 * Demo: Escrow/Project Milestone Flow
 * Complete workflow for freelance project escrow
 *
 * Run: npx tsx demo-escrow.ts
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
  getMneeBalance,
  createWalletClient2,
  getAccount2,
} from './lib/wallet.js';
import { createEscrowProject, fundEscrowProject, TWINKLE_ESCROW_ABI } from './lib/contracts.js';
import { api } from './lib/api.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Twinkle - Escrow/Project Demo');
  console.log('='.repeat(60));
  console.log(`Chain: ${CONFIG.chainName} (${CONFIG.chainId})`);
  console.log(`TwinkleEscrow: ${CONFIG.contracts.TwinkleEscrow}\n`);

  // Setup clients
  const publicClient = createPublicClientInstance();
  const walletClient = createWalletClientInstance();
  const account = getAccount();

  // Initialize Freelancer Wallet (Account 2)
  const walletClient2 = createWalletClient2();

  console.log('--- Wallet Info (Client) ---');
  await logWalletInfo(publicClient, account.address);
  console.log('--- Wallet Info (Freelancer) ---');
  await logWalletInfo(publicClient, walletClient2.account.address);


  // ===== STEP 1: Check existing projects =====
  console.log('\n--- Step 1: Checking Existing Projects ---');

  const existingProjects = await api.getProjects({ client: account.address });
  console.log(`Projects as client: ${existingProjects.length}`);

  if (existingProjects.length > 0) {
    console.log('\nExisting projects:');
    existingProjects.slice(0, 3).forEach((proj, i) => {
      console.log(`  ${i + 1}. ID: ${proj.id.slice(0, 18)}...`);
      console.log(`     Freelancer: ${proj.freelancer}`);
      console.log(`     Budget: ${formatEther(BigInt(proj.totalBudget))} tMNEE`);
      console.log(`     Status: ${proj.status}`);
    });
  }

  // ===== STEP 2: Create escrow project =====
  console.log('\n--- Step 2: Creating Escrow Project (By Freelancer) ---');

  // Setup: Client = Wallet 1, Freelancer = Wallet 2
  const client = account.address;
  const freelancer = walletClient2.account.address;

  const milestones = [
    { description: 'Project Setup & Design', amount: parseEther('1') },
    { description: 'Core Development', amount: parseEther('1') },
  ];

  const totalBudget = milestones.reduce((sum, m) => sum + m.amount, 0n);
  const duration = 30 * 24 * 60 * 60; // 30 days

  console.log('Project parameters:');
  console.log(`  Client: ${client}`);
  console.log(`  Freelancer: ${freelancer}`);
  console.log(`  Total Budget: ${formatEther(totalBudget)} tMNEE`);
  console.log(`  Duration: ${duration / 86400} days`);
  console.log('  Milestones:');
  milestones.forEach((m, i) => {
    console.log(`    ${i + 1}. ${m.description}: ${formatEther(m.amount)} tMNEE`);
  });

  try {
    console.log('\nSending createProject transaction (Freelancer)...');
    // Note: Freelancer (Wallet 2) must invoke createProject
    const { hash: projectHash, projectId } = await createEscrowProject(
      walletClient2, // Freelancer initiates
      publicClient,
      {
        client: client,
        freelancer: freelancer, // Effectively ignored by helper usually but passed for completeness
        milestoneAmounts: milestones.map((m) => m.amount),
        milestoneDescriptions: milestones.map((m) => m.description),
        duration,
      }
    );
    console.log(`Transaction hash: ${projectHash}`);
    console.log(`Project ID: ${projectId}`);

    // Wait for indexer to catch up slightly before proceeding
    console.log('\nWaiting for transaction confirmation (5s)...');
    await new Promise((r) => setTimeout(r, 5000));

    // Wait for indexer
    console.log('\nWaiting for indexer (3s)...');
    await new Promise((r) => setTimeout(r, 3000));

    // ===== STEP 3: Verify via API =====
    console.log('\n--- Step 3: Verifying via API ---');

    const apiProject = await api.getProject(projectId);
    if (apiProject) {
      console.log('Project from API:');
      console.log(`  Client: ${apiProject.client}`);
      console.log(`  Freelancer: ${apiProject.freelancer}`);
      console.log(`  Budget: ${formatEther(BigInt(apiProject.totalBudget))} tMNEE`);
      console.log(`  Status: ${apiProject.status}`);
    } else {
      console.log('Project not yet indexed');
    }

    // ===== STEP 4: Fund project =====
    console.log('\n--- Step 4: Funding Project ---');

    // Ensure allowance
    const allowance = await getMneeAllowance(
      publicClient,
      account.address,
      CONFIG.contracts.TwinkleEscrow
    );

    if (allowance < parseEther('2')) {
      console.log('Approving MNEE...');
      await approveMnee(
        walletClient,
        publicClient,
        CONFIG.contracts.TwinkleEscrow,
        parseEther('10')
      );
    }

    const fundHash = await fundEscrowProject(walletClient, publicClient, projectId);
    console.log(`Funding TX: ${fundHash}`);

    // Wait for funding
    console.log('\nWaiting for funding confirmation (5s)...');
    await new Promise((r) => setTimeout(r, 5000));

    // ===== STEP 5: Freelancer Request =====
    console.log('\n--- Step 5: Freelancer Request (Account 2) ---');

    // walletClient2 already initialized
    console.log(`Acting as Freelancer: ${walletClient2.account.address}`);

    console.log('Requesting Milestone 1...');
    const requestHash = await walletClient2.writeContract({
      address: CONFIG.contracts.TwinkleEscrow,
      abi: TWINKLE_ESCROW_ABI,
      functionName: 'requestMilestone',
      args: [projectId, 0n],
    });
    console.log(`Request TX: ${requestHash}`);

    await publicClient.waitForTransactionReceipt({ hash: requestHash });
    console.log('Milestone 1 Requested!');

    // ===== STEP 6: Client Approval =====
    console.log('\n--- Step 6: Client Approval (Account 1) ---');
    console.log('Approving Milestone 1...');

    const approveHash = await walletClient.writeContract({
      address: CONFIG.contracts.TwinkleEscrow,
      abi: TWINKLE_ESCROW_ABI,
      functionName: 'approveMilestone',
      args: [projectId, 0n],
    });
    console.log(`Approval TX: ${approveHash}`);

    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log('Milestone 1 Approved & Released!');

    // Check balances
    const bal2 = await getMneeBalance(publicClient, walletClient2.account.address);
    console.log(`Freelancer New Balance: ${formatEther(bal2)} tMNEE`);
  } catch (error: any) {
    console.log('Transaction error:', error.message?.slice(0, 100) || error);
  }

  // ===== STEP 6: View all projects =====
  console.log('\n--- Step 6: All User Projects ---');

  const clientProjects = await api.getProjects({ client: client });
  const freelancerProjects = await api.getProjects({ freelancer: freelancer });

  console.log(`Projects as client: ${clientProjects.length}`);
  console.log(`Projects as freelancer: ${freelancerProjects.length}`);

  // ===== Summary =====
  console.log('\n' + '='.repeat(60));
  console.log('Escrow/Project Demo Complete!');
  console.log('='.repeat(60));
  console.log('\nEscrow features:');
  console.log('- Milestone-based payment release');
  console.log('- Funds held securely in contract');
  console.log('- Sablier streaming for time-based releases');
  console.log('- Dispute resolution mechanism');
  console.log('- Client and freelancer protection');
}

main().catch(console.error);
