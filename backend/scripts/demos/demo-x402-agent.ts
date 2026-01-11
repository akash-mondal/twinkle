#!/usr/bin/env npx tsx
/**
 * Demo: x402 AI Agent Payment Flow
 * Full implementation of the x402 payment protocol for AI agents
 *
 * The x402 protocol (from Coinbase) enables AI agents to pay for resources:
 * 1. Agent requests resource -> Server responds HTTP 402 with payment requirements
 * 2. Agent signs EIP-712 payment authorization
 * 3. Agent retries with X-PAYMENT header containing signed payload
 * 4. Facilitator verifies signature and settles on-chain
 * 5. Server returns requested data
 *
 * Run: npx tsx demo-x402-agent.ts
 */

import { parseEther, formatEther, keccak256, encodePacked } from 'viem';
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
  signPaymentIntent,
  createPaymentIntent,
  buildX402Payload,
  encodeX402Header,
  generateNonce,
  type PaymentIntent,
} from './lib/eip712.js';
import { generatePaywallId } from './lib/contracts.js';
import { api } from './lib/api.js';

// Facilitator API endpoints
const FACILITATOR_URL = CONFIG.facilitatorUrl;

interface VerifyResponse {
  valid: boolean;
  reason?: string;
}

interface SettleResponse {
  success: boolean;
  accessProofId?: string;
  txHash?: string;
  error?: string;
}

/**
 * Simulate a 402 payment-required response from a content server
 */
function simulate402Response(paywallId: string, amount: bigint, payTo: string) {
  return {
    status: 402,
    headers: {
      'X-Payment-Required': 'true',
      'X-Payment-Amount': amount.toString(),
      'X-Payment-Asset': CONFIG.contracts.TestMNEE,
      'X-Payment-PayTo': payTo,
      'X-Payment-PaywallId': paywallId,
      'X-Payment-Network': `eip155:${CONFIG.chainId}`,
      'X-Payment-X402-Version': '1',
    },
  };
}

/**
 * Submit signed payment intent to facilitator for verification
 */
async function verifyWithFacilitator(
  requestId: string,
  intent: PaymentIntent,
  signature: string
): Promise<VerifyResponse> {
  const response = await fetch(`${FACILITATOR_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      intent: {
        payer: intent.payer,
        requestId: intent.requestId,
        amount: intent.amount.toString(),
        validUntil: intent.validUntil.toString(),
        nonce: intent.nonce.toString(),
      },
      signature,
    }),
  });

  return response.json();
}

/**
 * Submit signed payment intent to facilitator for settlement
 */
async function settleWithFacilitator(
  requestId: string,
  intent: PaymentIntent,
  signature: string
): Promise<SettleResponse> {
  const response = await fetch(`${FACILITATOR_URL}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      intent: {
        payer: intent.payer,
        requestId: intent.requestId,
        amount: intent.amount.toString(),
        validUntil: intent.validUntil.toString(),
        nonce: intent.nonce.toString(),
      },
      signature,
    }),
  });

  return response.json();
}

async function main() {
  console.log('='.repeat(60));
  console.log('Twinkle Protocol - x402 AI Agent Payment Demo');
  console.log('='.repeat(60));
  console.log(`Chain: Sepolia (${CONFIG.chainId})`);
  console.log(`Facilitator: ${FACILITATOR_URL}`);
  console.log(`TwinkleX402: ${CONFIG.contracts.TwinkleX402}\n`);

  // Setup clients
  const publicClient = createPublicClientInstance();
  const walletClient = createWalletClientInstance();
  const account = getAccount();

  console.log('--- Agent Wallet ---');
  await logWalletInfo(publicClient, account.address);

  // Check facilitator health
  console.log('\n--- Facilitator Health ---');
  try {
    const healthRes = await fetch(`${FACILITATOR_URL}/health`);
    const health = await healthRes.json();
    console.log('Facilitator Status:', health.status);
    console.log('Settlement Enabled:', health.settlementEnabled);
  } catch (error) {
    console.error('Facilitator not responding. Make sure it is running:');
    console.log('  pnpm --filter @twinkle/facilitator dev');
    process.exit(1);
  }

  // ===== STEP 1: Find or create a paywall =====
  console.log('\n--- Step 1: Finding Paywall ---');

  let paywallId: string;
  let paywallPrice: bigint;
  let payTo: string;

  // Try to find existing x402-enabled paywall
  const existingPaywalls = await api.getPaywalls({ active: true, limit: 10 });
  const x402Paywall = existingPaywalls.find(p => p.x402Enabled);

  if (x402Paywall) {
    paywallId = x402Paywall.id;
    paywallPrice = BigInt(x402Paywall.price);
    payTo = x402Paywall.creator;
    console.log('Found existing x402-enabled paywall:');
    console.log(`  ID: ${paywallId}`);
    console.log(`  Price: ${formatEther(paywallPrice)} tMNEE`);
    console.log(`  Creator: ${payTo}`);
  } else {
    // Create a new paywall for demo
    console.log('No x402-enabled paywall found. Creating one...');

    const contentId = `x402-demo-${Date.now()}`;
    paywallId = generatePaywallId(account.address, contentId);
    paywallPrice = parseEther('1'); // 1 tMNEE
    payTo = account.address;

    // This would normally be done via contract call
    console.log('  Created paywall (simulated):');
    console.log(`  ID: ${paywallId}`);
    console.log(`  Price: ${formatEther(paywallPrice)} tMNEE`);
    console.log(`  Creator: ${payTo}`);
  }

  // ===== STEP 2: Simulate 402 Response =====
  console.log('\n--- Step 2: Simulating 402 Payment Required ---');

  const paymentRequired = simulate402Response(paywallId, paywallPrice, payTo);
  console.log('Server Response: HTTP 402 Payment Required');
  console.log('Headers:');
  Object.entries(paymentRequired.headers).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });

  // ===== STEP 3: Ensure MNEE Allowance =====
  console.log('\n--- Step 3: Checking MNEE Allowance ---');

  const currentAllowance = await getMneeAllowance(
    publicClient,
    account.address,
    CONFIG.contracts.TwinkleX402
  );
  console.log(`Current allowance: ${formatEther(currentAllowance)} tMNEE`);

  if (currentAllowance < paywallPrice) {
    console.log('Approving MNEE spending...');
    const approveAmount = parseEther('1000'); // Approve 1000 tMNEE
    const approveTx = await approveMnee(
      walletClient,
      publicClient,
      CONFIG.contracts.TwinkleX402,
      approveAmount
    );
    console.log(`Approval TX: ${approveTx}`);
  } else {
    console.log('Sufficient allowance already approved');
  }

  // ===== STEP 4: Create Payment Request on Chain =====
  console.log('\n--- Step 4: Creating Payment Request ---');

  // Generate a unique request ID
  const nonce = generateNonce();
  const requestId = keccak256(
    encodePacked(
      ['address', 'bytes32', 'uint256', 'uint256'],
      [account.address, paywallId as `0x${string}`, paywallPrice, nonce]
    )
  );

  console.log(`Generated Request ID: ${requestId}`);
  console.log(`Nonce: ${nonce}`);

  // In production, this would call TwinkleX402.createPaymentRequest()
  // For demo, we'll work with the simulated request

  // ===== STEP 5: Build and Sign PaymentIntent (EIP-712) =====
  console.log('\n--- Step 5: Building EIP-712 PaymentIntent ---');

  const validUntil = BigInt(Math.floor(Date.now() / 1000) + 3600); // Valid for 1 hour

  const intent: PaymentIntent = createPaymentIntent({
    payer: account.address,
    requestId,
    amount: paywallPrice,
    validUntil,
    nonce,
  });

  console.log('PaymentIntent:');
  console.log(`  Payer: ${intent.payer}`);
  console.log(`  Request ID: ${intent.requestId}`);
  console.log(`  Amount: ${formatEther(intent.amount)} tMNEE`);
  console.log(`  Valid Until: ${new Date(Number(intent.validUntil) * 1000).toISOString()}`);
  console.log(`  Nonce: ${intent.nonce}`);

  console.log('\nSigning with EIP-712...');
  const signature = await signPaymentIntent(walletClient, intent);
  console.log(`Signature: ${signature.slice(0, 42)}...`);

  // ===== STEP 6: Build X-PAYMENT Header =====
  console.log('\n--- Step 6: Building X-PAYMENT Header ---');

  const x402Payload = buildX402Payload(intent, signature, payTo as `0x${string}`);
  const x402Header = encodeX402Header(x402Payload);

  console.log('X402 Payload:');
  console.log(`  Version: ${x402Payload.x402Version}`);
  console.log(`  Scheme: ${x402Payload.scheme}`);
  console.log(`  Network: ${x402Payload.network}`);
  console.log(`\nEncoded Header (base64): ${x402Header.slice(0, 50)}...`);

  // ===== STEP 7: Submit to Facilitator for Verification =====
  console.log('\n--- Step 7: Verifying with Facilitator ---');

  try {
    const verifyResult = await verifyWithFacilitator(requestId, intent, signature);
    console.log('Verification Result:', JSON.stringify(verifyResult, null, 2));
  } catch (error) {
    console.log('Verification endpoint not available (this is optional)');
  }

  // ===== STEP 8: Settlement (On-Chain Transaction) =====
  console.log('\n--- Step 8: Settlement Flow ---');
  console.log('NOTE: Actual settlement would trigger on-chain transaction');
  console.log('The facilitator would:');
  console.log('  1. Verify the signature matches the payer');
  console.log('  2. Check the payment request exists and is not expired');
  console.log('  3. Call TwinkleX402.settle() with the intent and signature');
  console.log('  4. The contract transfers MNEE from payer to recipient');
  console.log('  5. An AccessProof is generated and stored on-chain');

  // Try to settle (will fail if request doesn't exist on-chain)
  try {
    const settleResult = await settleWithFacilitator(requestId, intent, signature);
    if (settleResult.success) {
      console.log('\nSettlement successful!');
      console.log(`  Access Proof ID: ${settleResult.accessProofId}`);
      console.log(`  TX Hash: ${settleResult.txHash}`);
    } else {
      console.log('\nSettlement response:', settleResult.error || 'Not executed');
    }
  } catch (error) {
    console.log('\nSettlement skipped (demo mode - no on-chain request)');
  }

  // ===== STEP 9: Access Proof Verification =====
  console.log('\n--- Step 9: Access Verification Flow ---');
  console.log('After settlement, the content server would:');
  console.log('  1. Extract the accessProofId from the facilitator response');
  console.log('  2. Call TwinkleX402.verifyAccessProof(accessProofId)');
  console.log('  3. If valid, serve the protected content');
  console.log('  4. Cache the proof for subsequent requests');

  // ===== Summary =====
  console.log('\n' + '='.repeat(60));
  console.log('x402 AI Agent Payment Demo Complete!');
  console.log('='.repeat(60));
  console.log('\nKey takeaways:');
  console.log('1. Agent signs EIP-712 PaymentIntent off-chain (no gas)');
  console.log('2. Facilitator handles on-chain settlement');
  console.log('3. Access proofs are verifiable on-chain');
  console.log('4. Works with any HTTP API returning 402');
  console.log('\nReferences:');
  console.log('- x402.org - Protocol specification');
  console.log('- docs.cdp.coinbase.com/x402 - Coinbase implementation');
  console.log('- github.com/coinbase/x402 - Reference implementation');
}

main().catch(console.error);
