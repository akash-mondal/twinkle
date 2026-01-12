/**
 * Minimal Mainnet Test - Uses 0.1 MNEE and recycles funds
 * Uses correct TwinklePay ABI matching deployed contract
 */
import { createPublicClient, createWalletClient, http, parseEther, formatEther, keccak256, toHex } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { CONFIG } from './lib/config.js';

const MNEE_ABI = [
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'allowance', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const;

// Correct ABI matching deployed TwinklePay contract
const TWINKLE_PAY_ABI = [
  // createPaywall(bytes32 id, uint96 price, address splitAddress, bool x402Enabled)
  {
    type: 'function',
    name: 'createPaywall',
    inputs: [
      { name: 'id', type: 'bytes32' },
      { name: 'price', type: 'uint96' },
      { name: 'splitAddress', type: 'address' },
      { name: 'x402Enabled', type: 'bool' }
    ],
    outputs: [{ type: 'bytes32' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'pay',
    inputs: [{ name: 'paywallId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getPaywall',
    inputs: [{ name: 'paywallId', type: 'bytes32' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'splitAddress', type: 'address' },
      { name: 'totalUnlocks', type: 'uint256' },
      { name: 'totalRevenue', type: 'uint256' },
      { name: 'active', type: 'bool' },
      { name: 'x402Enabled', type: 'bool' },
      { name: 'refundable', type: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'isUnlocked',
    inputs: [{ name: 'paywallId', type: 'bytes32' }, { name: 'user', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view'
  },
] as const;

async function main() {
  const account = privateKeyToAccount(CONFIG.testPrivateKey);

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http('https://ethereum.publicnode.com'),
  });

  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http('https://ethereum.publicnode.com'),
  });

  const MNEE = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF' as const;
  const TwinklePay = CONFIG.contracts.TwinklePay;

  // Minimal test amount: 0.1 MNEE (as uint96)
  const TEST_PRICE = BigInt('100000000000000000'); // 0.1 MNEE in wei

  console.log('============================================================');
  console.log('Minimal Mainnet Test - 0.1 MNEE (will recycle)');
  console.log('============================================================');
  console.log('Wallet:', account.address);
  console.log('TwinklePay:', TwinklePay);
  console.log('Test Price: 0.1 MNEE');
  console.log('');

  // Check balances
  const ethBalance = await publicClient.getBalance({ address: account.address });
  const mneeBalance = await publicClient.readContract({
    address: MNEE,
    abi: MNEE_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  console.log('ETH Balance:', formatEther(ethBalance), 'ETH');
  console.log('MNEE Balance:', formatEther(mneeBalance), 'MNEE');
  console.log('');

  if (mneeBalance < TEST_PRICE) {
    console.log('ERROR: Insufficient MNEE balance');
    return;
  }

  // Step 1: Create paywall (splitAddress = self, so we get the funds back after platform fee!)
  console.log('--- Step 1: Create Paywall (splitAddress = self for recycling) ---');

  // Generate unique paywall ID (bytes32)
  const paywallId = keccak256(toHex(`minimal-test-${Date.now()}`));
  console.log('Paywall ID:', paywallId);

  const createHash = await walletClient.writeContract({
    address: TwinklePay,
    abi: TWINKLE_PAY_ABI,
    functionName: 'createPaywall',
    args: [
      paywallId,              // bytes32 id
      TEST_PRICE,             // uint96 price
      account.address,        // address splitAddress (self - for fund recycling)
      true                    // bool x402Enabled
    ],
  });

  console.log('Create TX:', createHash);
  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
  console.log('Status:', createReceipt.status);
  console.log('Gas Used:', createReceipt.gasUsed.toString());
  console.log('');

  // Step 2: Approve MNEE
  console.log('--- Step 2: Approve MNEE ---');
  const approveHash = await walletClient.writeContract({
    address: MNEE,
    abi: MNEE_ABI,
    functionName: 'approve',
    args: [TwinklePay, TEST_PRICE],
  });
  console.log('Approve TX:', approveHash);
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log('');

  // Step 3: Pay (funds go back to self minus platform fee)
  console.log('--- Step 3: Pay (recycling - funds return to self) ---');
  const payHash = await walletClient.writeContract({
    address: TwinklePay,
    abi: TWINKLE_PAY_ABI,
    functionName: 'pay',
    args: [paywallId],
  });
  console.log('Pay TX:', payHash);
  const payReceipt = await publicClient.waitForTransactionReceipt({ hash: payHash });
  console.log('Status:', payReceipt.status);
  console.log('Gas Used:', payReceipt.gasUsed.toString());
  console.log('');

  // Step 4: Verify unlock
  console.log('--- Step 4: Verify ---');
  const isUnlocked = await publicClient.readContract({
    address: TwinklePay,
    abi: TWINKLE_PAY_ABI,
    functionName: 'isUnlocked',
    args: [paywallId, account.address],
  });
  console.log('Unlocked:', isUnlocked ? 'YES' : 'NO');

  // Final balance
  const finalMnee = await publicClient.readContract({
    address: MNEE,
    abi: MNEE_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  const spent = mneeBalance - finalMnee;
  console.log('Final MNEE:', formatEther(finalMnee), 'MNEE');
  console.log('Net MNEE spent:', formatEther(spent), 'MNEE (platform fee only ~2.5%)');
  console.log('');
  console.log('============================================================');
  console.log('TEST COMPLETE - Funds recycled!');
  console.log('============================================================');
}

main().catch(console.error);
