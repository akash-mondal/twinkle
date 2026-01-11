/**
 * Twinkle - x402 Settlement Test Script
 *
 * This script:
 * 1. Creates a payment request on TwinkleX402
 * 2. Signs an EIP-712 PaymentIntent
 * 3. Calls the facilitator to settle
 * 4. Verifies the settlement via API
 *
 * Usage: npx tsx scripts/test-x402-settle.ts
 */

import { createWalletClient, createPublicClient, http, parseEther, keccak256, toHex, encodeFunctionData } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Contract addresses
const CONTRACTS = {
  TwinkleX402: '0x1E23bfd3A09cbC1b14Eab392068C6eB9217730C3' as `0x${string}`,
  TestMNEE: '0xF730d47c3003eCaE2608C452BCD5b0edf825e51C' as `0x${string}`,
};

// TwinkleX402 ABI (minimal for testing)
const TwinkleX402Abi = [
  {
    name: 'createPaymentRequest',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'payTo', type: 'address' },
      { name: 'amount', type: 'uint128' },
      { name: 'paywallId', type: 'bytes32' },
      { name: 'validFor', type: 'uint40' },
    ],
    outputs: [{ name: 'requestId', type: 'bytes32' }],
  },
  {
    name: 'getPaymentRequest',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'requestId', type: 'bytes32' }],
    outputs: [
      { name: 'payTo', type: 'address' },
      { name: 'amount', type: 'uint128' },
      { name: 'paywallId', type: 'bytes32' },
      { name: 'validUntil', type: 'uint40' },
      { name: 'settled', type: 'bool' },
    ],
  },
  {
    name: 'nonces',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'PaymentRequestCreated',
    inputs: [
      { name: 'requestId', type: 'bytes32', indexed: true },
      { name: 'payTo', type: 'address', indexed: true },
      { name: 'amount', type: 'uint128', indexed: false },
      { name: 'paywallId', type: 'bytes32', indexed: false },
      { name: 'validUntil', type: 'uint40', indexed: false },
    ],
  },
] as const;

// TestMNEE ABI (minimal)
const TestMNEEAbi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// EIP-712 domain
const EIP712_DOMAIN = {
  name: 'TwinkleX402',
  version: '1',
  chainId: 11155111n,
  verifyingContract: CONTRACTS.TwinkleX402,
};

// PaymentIntent type
const PAYMENT_INTENT_TYPES = {
  PaymentIntent: [
    { name: 'payer', type: 'address' },
    { name: 'requestId', type: 'bytes32' },
    { name: 'amount', type: 'uint256' },
    { name: 'validUntil', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

async function main() {
  console.log('🚀 Twinkle x402 Settlement Test\n');

  // Load environment
  const privateKey = process.env.TEST_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL;
  const facilitatorUrl = process.env.FACILITATOR_URL || 'http://localhost:3001';

  if (!privateKey) {
    console.error('❌ TEST_PRIVATE_KEY or PRIVATE_KEY not set');
    process.exit(1);
  }

  if (!rpcUrl) {
    console.error('❌ RPC_URL or SEPOLIA_RPC_URL not set');
    process.exit(1);
  }

  // Create clients
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log(`📍 Using account: ${account.address}`);

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // Check MNEE balance
  const balance = await publicClient.readContract({
    address: CONTRACTS.TestMNEE,
    abi: TestMNEEAbi,
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log(`💰 MNEE Balance: ${Number(balance) / 1e18} tMNEE\n`);

  // Step 1: Create a payment request
  console.log('📝 Step 1: Creating payment request...');

  const payTo = account.address; // Pay to self for testing
  const amount = parseEther('10');
  const paywallId = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
  const validFor = 3600n; // 1 hour

  const createTxHash = await walletClient.writeContract({
    address: CONTRACTS.TwinkleX402,
    abi: TwinkleX402Abi,
    functionName: 'createPaymentRequest',
    args: [payTo, amount, paywallId, Number(validFor)],
  });
  console.log(`   TX: ${createTxHash}`);

  // Wait for confirmation
  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createTxHash });
  console.log(`   Block: ${createReceipt.blockNumber}`);

  // Get request ID from logs
  const createLog = createReceipt.logs.find(
    (log) => log.address.toLowerCase() === CONTRACTS.TwinkleX402.toLowerCase()
  );

  if (!createLog || !createLog.topics[1]) {
    console.error('❌ Could not find PaymentRequestCreated event');
    process.exit(1);
  }

  const requestId = createLog.topics[1] as `0x${string}`;
  console.log(`   Request ID: ${requestId}\n`);

  // Step 2: Approve MNEE for TwinkleX402
  console.log('📝 Step 2: Approving MNEE for TwinkleX402...');

  const currentAllowance = await publicClient.readContract({
    address: CONTRACTS.TestMNEE,
    abi: TestMNEEAbi,
    functionName: 'allowance',
    args: [account.address, CONTRACTS.TwinkleX402],
  });

  if (currentAllowance < amount) {
    const approveTxHash = await walletClient.writeContract({
      address: CONTRACTS.TestMNEE,
      abi: TestMNEEAbi,
      functionName: 'approve',
      args: [CONTRACTS.TwinkleX402, parseEther('1000')],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
    console.log(`   Approved MNEE. TX: ${approveTxHash}\n`);
  } else {
    console.log(`   Already approved\n`);
  }

  // Step 3: Get nonce and sign PaymentIntent
  console.log('📝 Step 3: Signing PaymentIntent...');

  const nonce = await publicClient.readContract({
    address: CONTRACTS.TwinkleX402,
    abi: TwinkleX402Abi,
    functionName: 'nonces',
    args: [account.address],
  });

  const validUntil = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const paymentIntent = {
    payer: account.address,
    requestId,
    amount: BigInt(amount.toString()),
    validUntil,
    nonce,
  };

  console.log('   PaymentIntent:', {
    ...paymentIntent,
    amount: paymentIntent.amount.toString(),
    validUntil: paymentIntent.validUntil.toString(),
    nonce: paymentIntent.nonce.toString(),
  });

  const signature = await walletClient.signTypedData({
    domain: EIP712_DOMAIN,
    types: PAYMENT_INTENT_TYPES,
    primaryType: 'PaymentIntent',
    message: paymentIntent,
  });
  console.log(`   Signature: ${signature.slice(0, 20)}...${signature.slice(-10)}\n`);

  // Step 4: Call facilitator to settle
  console.log('📝 Step 4: Calling facilitator to settle...');
  console.log(`   Facilitator URL: ${facilitatorUrl}`);

  const paymentPayload = {
    x402Version: 1,
    scheme: 'exact',
    network: 'eip155:11155111',
    payload: {
      signature,
      authorization: {
        payer: account.address,
        requestId,
        amount: amount.toString(),
        validUntil: validUntil.toString(),
        nonce: nonce.toString(),
      },
    },
  };

  const paymentRequirements = {
    scheme: 'exact',
    network: 'eip155:11155111',
    maxAmountRequired: amount.toString(),
    resource: 'https://example.com/test-content',
    payTo: account.address,
    maxTimeoutSeconds: 60,
    asset: CONTRACTS.TestMNEE,
  };

  try {
    // First verify
    console.log('\n   Verifying payment...');
    const verifyResponse = await fetch(`${facilitatorUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentPayload, paymentRequirements }),
    });
    const verifyResult = await verifyResponse.json();
    console.log('   Verify result:', verifyResult);

    if (!verifyResult.valid) {
      console.error(`❌ Verification failed: ${verifyResult.invalidReason}`);
      process.exit(1);
    }

    // Then settle
    console.log('\n   Settling payment...');
    const settleResponse = await fetch(`${facilitatorUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentPayload, paymentRequirements }),
    });
    const settleResult = await settleResponse.json();
    console.log('   Settle result:', settleResult);

    if (settleResult.success) {
      console.log(`\n✅ Settlement successful!`);
      console.log(`   Transaction: ${settleResult.transactionHash}`);
      console.log(`   Access Proof ID: ${settleResult.accessProofId}`);
    } else {
      console.error(`❌ Settlement failed: ${settleResult.error}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Facilitator not running. Start it with: pnpm facilitator:dev');
      console.log('\n   Manual settlement data:');
      console.log('   Payment Payload:', JSON.stringify(paymentPayload, null, 2));
      console.log('   Payment Requirements:', JSON.stringify(paymentRequirements, null, 2));
    } else {
      throw error;
    }
  }

  // Step 5: Verify the payment request is settled
  console.log('\n📝 Step 5: Verifying settlement on-chain...');

  const request = await publicClient.readContract({
    address: CONTRACTS.TwinkleX402,
    abi: TwinkleX402Abi,
    functionName: 'getPaymentRequest',
    args: [requestId],
  });

  console.log('   Payment Request:');
  console.log(`   - payTo: ${request[0]}`);
  console.log(`   - amount: ${Number(request[1]) / 1e18} MNEE`);
  console.log(`   - paywallId: ${request[2]}`);
  console.log(`   - validUntil: ${new Date(Number(request[3]) * 1000).toISOString()}`);
  console.log(`   - settled: ${request[4]}`);

  console.log('\n🎉 x402 Settlement Test Complete!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
