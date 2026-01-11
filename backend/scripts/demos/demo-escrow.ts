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
} from './lib/wallet.js';
import { createEscrowProject, fundEscrowProject } from './lib/contracts.js';
import { api } from './lib/api.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Twinkle Protocol - Escrow/Project Demo');
  console.log('='.repeat(60));
  console.log(`Chain: Sepolia (${CONFIG.chainId})`);
  console.log(`TwinkleEscrow: ${CONFIG.contracts.TwinkleEscrow}\n`);

  // Setup clients
  const publicClient = createPublicClientInstance();
  const walletClient = createWalletClientInstance();
  const account = getAccount();

  console.log('--- Wallet Info (Client) ---');
  await logWalletInfo(publicClient, account.address);

  // For this demo, we'll use the same address as both client and freelancer
  // In production, these would be different addresses
  const clientAddress = account.address;
  const freelancerAddress = account.address; // Would be different in real use

  // ===== STEP 1: Check existing projects =====
  console.log('\n--- Step 1: Checking Existing Projects ---');

  const existingProjects = await api.getProjects({ client: clientAddress });
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
  console.log('\n--- Step 2: Creating Escrow Project ---');

  const milestones = [
    { amount: parseEther('100'), description: 'Project Setup & Design' },
    { amount: parseEther('200'), description: 'Core Development' },
    { amount: parseEther('100'), description: 'Testing & Deployment' },
  ];

  const totalBudget = milestones.reduce((sum, m) => sum + m.amount, 0n);
  const duration = 30 * 24 * 60 * 60; // 30 days

  console.log('Project parameters:');
  console.log(`  Client: ${clientAddress}`);
  console.log(`  Freelancer: ${freelancerAddress}`);
  console.log(`  Total Budget: ${formatEther(totalBudget)} tMNEE`);
  console.log(`  Duration: ${duration / 86400} days`);
  console.log('  Milestones:');
  milestones.forEach((m, i) => {
    console.log(`    ${i + 1}. ${m.description}: ${formatEther(m.amount)} tMNEE`);
  });

  try {
    console.log('\nSending createProject transaction...');
    const { hash: projectHash, projectId } = await createEscrowProject(
      walletClient,
      publicClient,
      {
        freelancer: freelancerAddress,
        milestoneAmounts: milestones.map((m) => m.amount),
        milestoneDescriptions: milestones.map((m) => m.description),
        duration,
      }
    );
    console.log(`Transaction hash: ${projectHash}`);
    console.log(`Project ID: ${projectId}`);

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
      clientAddress,
      CONFIG.contracts.TwinkleEscrow
    );

    if (allowance < totalBudget) {
      console.log('Approving MNEE...');
      await approveMnee(
        walletClient,
        publicClient,
        CONFIG.contracts.TwinkleEscrow,
        parseEther('10000')
      );
    }

    console.log('Sending fundProject transaction...');
    const fundHash = await fundEscrowProject(walletClient, publicClient, projectId);
    console.log(`Fund TX: ${fundHash}`);

    // Wait for indexer
    console.log('\nWaiting for indexer (3s)...');
    await new Promise((r) => setTimeout(r, 3000));

    // ===== STEP 5: Project workflow description =====
    console.log('\n--- Step 5: Project Workflow ---');
    console.log('After funding, the workflow continues:');
    console.log('');
    console.log('1. FREELANCER: acceptProject(projectId)');
    console.log('   - Freelancer commits to the project');
    console.log('   - Status: FUNDED -> IN_PROGRESS');
    console.log('');
    console.log('2. FREELANCER: completeMilestone(projectId, 0)');
    console.log('   - Marks first milestone as complete');
    console.log('   - Awaiting client review');
    console.log('');
    console.log('3. CLIENT: approveMilestone(projectId, 0)');
    console.log('   - Approves the milestone');
    console.log('   - Funds automatically released to freelancer');
    console.log('');
    console.log('4. Repeat for remaining milestones...');
    console.log('');
    console.log('5. All milestones approved -> Status: COMPLETED');
    console.log('');
    console.log('Dispute resolution:');
    console.log('- Either party can raise a dispute');
    console.log('- Funds held in escrow until resolved');
    console.log('- Admin or arbitration can resolve');
  } catch (error: any) {
    console.log('Transaction error:', error.message?.slice(0, 100) || error);
  }

  // ===== STEP 6: View all projects =====
  console.log('\n--- Step 6: All User Projects ---');

  const clientProjects = await api.getProjects({ client: clientAddress });
  const freelancerProjects = await api.getProjects({ freelancer: freelancerAddress });

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
