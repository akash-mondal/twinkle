
import { createPublicClient, http, formatEther, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import 'dotenv/config';

const MNEE_ADDRESS = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF'; // Mainnet MNEE

async function verifyWallet() {
    const privateKey = process.env.TEST_PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
        throw new Error("TEST_PRIVATE_KEY not found in .env");
    }

    const account = privateKeyToAccount(privateKey);
    console.log(`Derived Address: ${account.address}`);

    const client = createPublicClient({
        chain: mainnet,
        transport: http(process.env.RPC_URL || 'https://ethereum.publicnode.com'),
    });

    // Check ETH Balance
    const ethBalance = await client.getBalance({ address: account.address });
    console.log(`ETH Balance: ${formatEther(ethBalance)} ETH`);

    // Check MNEE Balance
    const mneeParams = {
        address: MNEE_ADDRESS,
        abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
        functionName: 'balanceOf',
        args: [account.address]
    } as const;

    try {
        const mneeBalance = await client.readContract(mneeParams);
        console.log(`MNEE Balance: ${formatEther(mneeBalance)} MNEE`);
    } catch (error) {
        console.error("Error fetching MNEE balance:", error);
    }
}

verifyWallet().catch(console.error);
