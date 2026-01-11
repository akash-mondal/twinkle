#!/usr/bin/env npx tsx
/**
 * Demo: Revenue Split Distribution
 * Create splits and distribute revenue among recipients
 *
 * Run: npx tsx demo-split.ts
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
} from './lib/wallet.js';
import { createSplit, depositToSplit, distributeSplit } from './lib/contracts.js';
import { api } from './lib/api.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Twinkle Protocol - Revenue Split Demo');
  console.log('='.repeat(60));
  console.log(`Chain: Sepolia (${CONFIG.chainId})`);
  console.log(`TwinkleSplit: ${CONFIG.contracts.TwinkleSplit}\n`);

  // Setup clients
  const publicClient = createPublicClientInstance();
  const walletClient = createWalletClientInstance();
  const account = getAccount();

  console.log('--- Wallet Info ---');
  await logWalletInfo(publicClient, account.address);

  // ===== STEP 1: Check existing splits =====
  console.log('\n--- Step 1: Checking Existing Splits ---');

  const existingSplits = await api.getSplits({ creator: account.address });
  console.log(`Existing splits by creator: ${existingSplits.length}`);

  if (existingSplits.length > 0) {
    console.log('\nExisting splits:');
    existingSplits.slice(0, 3).forEach((split, i) => {
      console.log(`  ${i + 1}. ID: ${split.id.slice(0, 18)}...`);
      console.log(`     Recipients: ${split.recipients?.length || 0}`);
      console.log(`     Deposited: ${formatEther(BigInt(split.totalDeposited))} tMNEE`);
      console.log(`     Distributed: ${formatEther(BigInt(split.totalDistributed))} tMNEE`);
    });
  }

  // ===== STEP 2: Create revenue split =====
  console.log('\n--- Step 2: Creating Revenue Split ---');

  // Define recipients and their shares (basis points, 10000 = 100%)
  // Using the same address for demo - in production these would be different
  const recipients = [
    { address: account.address, share: 5000n }, // 50%
    { address: '0x1111111111111111111111111111111111111111' as `0x${string}`, share: 3000n }, // 30%
    { address: '0x2222222222222222222222222222222222222222' as `0x${string}`, share: 2000n }, // 20%
  ];

  console.log('Split configuration:');
  recipients.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.address.slice(0, 10)}... - ${Number(r.share) / 100}%`);
  });

  try {
    console.log('\nSending createSplit transaction...');
    const { hash: splitHash, splitId } = await createSplit(walletClient, publicClient, {
      recipients: recipients.map((r) => r.address),
      shares: recipients.map((r) => r.share),
    });
    console.log(`Transaction hash: ${splitHash}`);
    console.log(`Split ID: ${splitId}`);

    // Wait for indexer
    console.log('\nWaiting for indexer (3s)...');
    await new Promise((r) => setTimeout(r, 3000));

    // ===== STEP 3: Verify via API =====
    console.log('\n--- Step 3: Verifying via API ---');

    const apiSplit = await api.getSplit(splitId);
    if (apiSplit) {
      console.log('Split from API:');
      console.log(`  Creator: ${apiSplit.creator}`);
      console.log(`  Recipients: ${apiSplit.recipients?.length || 0}`);
      console.log(`  Deposited: ${formatEther(BigInt(apiSplit.totalDeposited))} tMNEE`);
    } else {
      console.log('Split not yet indexed');
    }

    // ===== STEP 4: Deposit to split =====
    console.log('\n--- Step 4: Depositing to Split ---');

    const depositAmount = parseEther('100'); // 100 tMNEE

    // Ensure allowance
    const allowance = await getMneeAllowance(
      publicClient,
      account.address,
      CONFIG.contracts.TwinkleSplit
    );

    if (allowance < depositAmount) {
      console.log('Approving MNEE...');
      await approveMnee(
        walletClient,
        publicClient,
        CONFIG.contracts.TwinkleSplit,
        parseEther('10000')
      );
    }

    console.log(`Depositing ${formatEther(depositAmount)} tMNEE...`);
    const depositHash = await depositToSplit(
      walletClient,
      publicClient,
      splitId,
      depositAmount
    );
    console.log(`Deposit TX: ${depositHash}`);

    // Wait for indexer
    console.log('\nWaiting for indexer (3s)...');
    await new Promise((r) => setTimeout(r, 3000));

    // ===== STEP 5: Distribute to recipients =====
    console.log('\n--- Step 5: Distributing to Recipients ---');

    console.log('Expected distribution:');
    recipients.forEach((r) => {
      const amount = (depositAmount * r.share) / 10000n;
      console.log(`  ${r.address.slice(0, 10)}...: ${formatEther(amount)} tMNEE`);
    });

    console.log('\nSending distribute transaction...');
    const distributeHash = await distributeSplit(walletClient, publicClient, splitId);
    console.log(`Distribute TX: ${distributeHash}`);

    // Wait for indexer
    console.log('\nWaiting for indexer (3s)...');
    await new Promise((r) => setTimeout(r, 3000));

    // ===== STEP 6: Verify distribution =====
    console.log('\n--- Step 6: Verifying Distribution ---');

    const balance = await getMneeBalance(publicClient, account.address);
    console.log(`Creator balance after distribution: ${balance} tMNEE`);

    const updatedSplit = await api.getSplit(splitId);
    if (updatedSplit) {
      console.log('\nUpdated split stats:');
      console.log(`  Total Deposited: ${formatEther(BigInt(updatedSplit.totalDeposited))} tMNEE`);
      console.log(`  Total Distributed: ${formatEther(BigInt(updatedSplit.totalDistributed))} tMNEE`);
    }
  } catch (error: any) {
    console.log('Transaction error:', error.message?.slice(0, 100) || error);
  }

  // ===== Use Cases =====
  console.log('\n--- Revenue Split Use Cases ---');
  console.log('');
  console.log('1. CONTENT COLLABORATION');
  console.log('   - Multiple creators share revenue from paywall');
  console.log('   - Automatic fair distribution');
  console.log('');
  console.log('2. TEAM PAYMENTS');
  console.log('   - Project funds split among team members');
  console.log('   - Transparent share allocation');
  console.log('');
  console.log('3. ROYALTY DISTRIBUTION');
  console.log('   - NFT/content royalties to multiple parties');
  console.log('   - Publisher, artist, platform shares');
  console.log('');
  console.log('4. DAO TREASURY');
  console.log('   - Split incoming funds to multiple wallets');
  console.log('   - Automated treasury management');

  // ===== Summary =====
  console.log('\n' + '='.repeat(60));
  console.log('Revenue Split Demo Complete!');
  console.log('='.repeat(60));
  console.log('\nSplit features:');
  console.log('- Configurable recipient shares (basis points)');
  console.log('- Accumulate deposits before distribution');
  console.log('- Anyone can trigger distribution');
  console.log('- Integrates with paywalls for automatic splits');
}

main().catch(console.error);
