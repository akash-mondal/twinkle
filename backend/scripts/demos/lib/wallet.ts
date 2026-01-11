/**
 * Wallet utilities for Twinkle demos
 * Provides viem wallet client setup and common operations
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  parseEther,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { CONFIG } from './config.js';

/**
 * Create a public client for reading from the blockchain
 */
export function createPublicClientInstance(): PublicClient {
  return createPublicClient({
    chain: sepolia,
    transport: http(CONFIG.rpcUrl),
  });
}

/**
 * Create a wallet client for signing transactions
 */
export function createWalletClientInstance(privateKey?: string): WalletClient {
  const account = privateKeyToAccount(
    (privateKey || CONFIG.testPrivateKey) as `0x${string}`
  );

  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(CONFIG.rpcUrl),
  });
}

/**
 * Get account from private key
 */
export function getAccount(privateKey?: string): Account {
  return privateKeyToAccount(
    (privateKey || CONFIG.testPrivateKey) as `0x${string}`
  );
}

/**
 * Get ETH balance for an address
 */
export async function getEthBalance(
  client: PublicClient,
  address: `0x${string}`
): Promise<string> {
  const balance = await client.getBalance({ address });
  return formatEther(balance);
}

/**
 * Get MNEE token balance for an address
 */
export async function getMneeBalance(
  client: PublicClient,
  address: `0x${string}`
): Promise<string> {
  const balance = await client.readContract({
    address: CONFIG.contracts.TestMNEE,
    abi: [
      {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'balanceOf',
    args: [address],
  });
  return formatEther(balance as bigint);
}

/**
 * Approve MNEE spending for a contract
 */
export async function approveMnee(
  walletClient: WalletClient,
  publicClient: PublicClient,
  spender: `0x${string}`,
  amount: bigint
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONFIG.contracts.TestMNEE,
    abi: [
      {
        type: 'function',
        name: 'approve',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
      },
    ],
    functionName: 'approve',
    args: [spender, amount],
  });

  // Wait for confirmation
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/**
 * Get MNEE allowance
 */
export async function getMneeAllowance(
  client: PublicClient,
  owner: `0x${string}`,
  spender: `0x${string}`
): Promise<bigint> {
  const allowance = await client.readContract({
    address: CONFIG.contracts.TestMNEE,
    abi: [
      {
        type: 'function',
        name: 'allowance',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'allowance',
    args: [owner, spender],
  });
  return allowance as bigint;
}

/**
 * Log wallet info
 */
export async function logWalletInfo(
  publicClient: PublicClient,
  address: `0x${string}`
): Promise<void> {
  const ethBalance = await getEthBalance(publicClient, address);
  const mneeBalance = await getMneeBalance(publicClient, address);

  console.log('\n=== Wallet Info ===');
  console.log(`Address: ${address}`);
  console.log(`ETH Balance: ${ethBalance} ETH`);
  console.log(`MNEE Balance: ${mneeBalance} tMNEE`);
}
