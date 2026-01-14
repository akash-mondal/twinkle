
import { createPublicClient, http, formatEther, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';
import 'dotenv/config';

const MNEE_ADDRESS = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF'; // Mainnet MNEE
const WALLET_ADDRESS = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'; // Derived from 4f59...

async function checkBalances() {
    const client = createPublicClient({
        chain: mainnet,
        transport: http(process.env.RPC_URL || 'https://ethereum.publicnode.com'),
    });

    console.log(`Checking balances for: ${WALLET_ADDRESS}`);

    // Check ETH Balance
    const ethBalance = await client.getBalance({ address: WALLET_ADDRESS });
    console.log(`ETH Balance: ${formatEther(ethBalance)} ETH`);

    // Check MNEE Balance
    const mneeParams = {
        address: MNEE_ADDRESS,
        abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
        functionName: 'balanceOf',
        args: [WALLET_ADDRESS]
    } as const;

    try {
        const mneeBalance = await client.readContract(mneeParams);
        console.log(`MNEE Balance: ${formatEther(mneeBalance)} MNEE`);
    } catch (error) {
        console.error("Error fetching MNEE balance:", error);
    }
}

checkBalances().catch(console.error);
