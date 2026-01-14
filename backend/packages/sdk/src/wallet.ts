/**
 * Wallet utilities
 */

import {
    createPublicClient,
    createWalletClient,
    http,
    formatEther,
    type PublicClient,
    type WalletClient,
    type Account,
    type Transport,
    type Chain,
} from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { SDK_CONFIG } from './config.js';

/**
 * Get the configured chain object
 */
export function getChain(): Chain {
    // If chainId is 1, return mainnet. If 11155111, return sepolia.
    // Otherwise default to mainnet as a safe fallback for typing, 
    // but users should ensure config matches.
    return SDK_CONFIG.chainId === 11155111 ? sepolia : mainnet;
}

/**
 * Create a public client for reading from the blockchain
 */
export function createPublicClientInstance(rpcUrl?: string): PublicClient {
    return createPublicClient({
        chain: getChain(),
        transport: http(rpcUrl || SDK_CONFIG.rpcUrl),
    });
}

/**
 * Create a wallet client for signing transactions
 */
export function createWalletClientInstance(
    privateKeyOrAccount: string | Account
): WalletClient {
    const account = typeof privateKeyOrAccount === 'string'
        ? privateKeyToAccount(privateKeyOrAccount as `0x${string}`)
        : privateKeyOrAccount;

    return createWalletClient({
        account,
        chain: getChain(),
        transport: http(SDK_CONFIG.rpcUrl),
    });
}

/**
 * Helper to get MNEE balance
 */
export async function getMneeBalance(
    client: PublicClient,
    address: `0x${string}`
): Promise<string> {
    const balance = await client.readContract({
        address: SDK_CONFIG.contracts.MNEE,
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
 * Helper to approve MNEE spending
 */
export async function approveMnee(
    walletClient: WalletClient,
    publicClient: PublicClient,
    spender: `0x${string}`,
    amount: bigint,
    wait = true
): Promise<`0x${string}`> {
    const hash = await walletClient.writeContract({
        chain: getChain(),
        account: walletClient.account!,
        address: SDK_CONFIG.contracts.MNEE,
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

    if (wait) {
        await publicClient.waitForTransactionReceipt({ hash });
    }
    return hash;
}
