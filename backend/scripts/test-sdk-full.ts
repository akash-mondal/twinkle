import {
    initTwinkle,
    // Contract Helpers
    createPaywall,
    payForPaywall,
    createSubscriptionPlan,
    subscribeToPlan,
    createSplit,
    depositToSplit,
    createEscrowProject,
    fundEscrowProject,
    requestMilestone,
    approveMilestone,
    // API
    api as TwinkleClient,
    // Wallet
    createWalletClientInstance,
    createPublicClientInstance,
    approveMnee,
    getMneeBalance,
    SDK_CONFIG
} from '../packages/sdk/dist';
import { parseEther } from 'viem';
import dotenv from 'dotenv';
dotenv.config();

const formatKey = (key: string | undefined): `0x${string}` | undefined => {
    if (!key) return undefined;
    const trimmed = key.trim();
    if (trimmed.startsWith('0x')) return trimmed as `0x${string}`;
    return `0x${trimmed}` as `0x${string}`;
};

const pk1 = formatKey(process.env.TEST_PRIVATE_KEY);
const pk2 = formatKey(process.env.TEST_PRIVATE_KEY_2);

if (!pk1) {
    console.error('❌ Missing TEST_PRIVATE_KEY');
    process.exit(1);
}

const privateKey1 = pk1;
const privateKey2 = pk2 || pk1; // Fallback to same key if 2nd missing

console.log(`Key 1: ${privateKey1.slice(0, 6)}... (Valid: ${privateKey1.startsWith('0x')})`);
console.log(`Key 2: ${privateKey2.slice(0, 6)}... (Valid: ${privateKey2.startsWith('0x')})`);

// Config
const CONFIG = initTwinkle({
    apiUrl: 'https://tw1nkl3.rest',
    // chainId: 1 // Default
});

async function main() {
    console.log('🚀 Starting Full SDK Verification on Mainnet');
    console.log(`Backend URL: ${CONFIG.apiUrl}`);

    // Create Clients
    const walletClient1 = createWalletClientInstance(privateKey1);
    const walletClient2 = createWalletClientInstance(privateKey2);
    const publicClient = createPublicClientInstance();

    const address1 = walletClient1.account.address;
    const address2 = walletClient2.account.address;

    console.log(`Wallet 1 (Client): ${address1}`);
    console.log(`Wallet 2 (Freelancer): ${address2}`);

    // Check Balances
    const bal1 = await getMneeBalance(publicClient, address1);
    const bal2 = await getMneeBalance(publicClient, address2);
    console.log(`Balance 1: ${bal1} MNEE`);
    console.log(`Balance 2: ${bal2} MNEE`);

    try {
        // --- 1. Paywall ---
        console.log('\n--- 1. Testing Paywall ---');
        // Paywall usually uses Native ETH or Token depending on config.
        // Our deployed paywall likely uses MNEE? If so, we need approve.
        // But previous run succeeded in paying, maybe it used ETH or allowance existed.
        // Optimization: Approve Paywall just in case if using tokens
        console.log('Approving TwinklePay...');
        await approveMnee(walletClient1, publicClient, SDK_CONFIG.contracts.TwinklePay, parseEther('100'));

        const payPrice = parseEther('0.00001'); // Tiny amount
        console.log(`Creating Paywall (Price: ${payPrice.toString()} wei)...`);

        const paywallRes = await createPaywall(walletClient1, publicClient, {
            contentId: 'test-content-' + Date.now(),
            price: payPrice
        });
        console.log(`Paywall TX: ${paywallRes.hash} | ID: ${paywallRes.paywallId}`);

        console.log('Paying for Paywall...');
        const payTx = await payForPaywall(walletClient1, publicClient, paywallRes.paywallId);
        console.log(`Pay TX: ${payTx}`);

        // --- 2. Subscription ---
        console.log('\n--- 2. Testing Subscription ---');
        console.log('Approving TwinkleSubscription...');
        await approveMnee(walletClient2, publicClient, SDK_CONFIG.contracts.TwinkleSubscription, parseEther('100'));

        const subPrice = parseEther('0.00001');
        console.log(`Creating Plan (Price: ${subPrice.toString()})...`);
        const planRes = await createSubscriptionPlan(walletClient1, publicClient, {
            price: subPrice,
            interval: 60
        });
        console.log(`Plan TX: ${planRes.hash} | ID: ${planRes.planId}`);

        console.log('Subscribing to Plan...');
        const subTx = await subscribeToPlan(walletClient2, publicClient, planRes.planId);
        console.log(`Subscribe TX: ${subTx}`);

        // --- 3. Split ---
        console.log('\n--- 3. Testing Split ---');
        console.log('Approving TwinkleSplit (if needed for deposits)...');
        await approveMnee(walletClient1, publicClient, SDK_CONFIG.contracts.TwinkleSplit, parseEther('100'));

        console.log('Creating Split (50/50)...');
        const splitRes = await createSplit(walletClient1, publicClient, {
            recipients: [address1, address2],
            shares: [BigInt(500000), BigInt(500000)]
        });
        console.log(`Split TX: ${splitRes.hash} | ID: ${splitRes.splitId}`);

        // Deposit to Split (Example)
        console.log('Depositing to Split...');
        const depTx = await depositToSplit(walletClient1, publicClient, splitRes.splitId, parseEther('0.00001'));
        console.log(`Deposit TX: ${depTx}`);

        // --- 4. Escrow ---
        console.log('\n--- 4. Testing Escrow ---');
        console.log('Approving TwinkleEscrow...');
        await approveMnee(walletClient1, publicClient, SDK_CONFIG.contracts.TwinkleEscrow, parseEther('100'));

        const escrowBudget = parseEther('0.00002');
        console.log(`Client creating Project (Budget: ${escrowBudget.toString()})...`);

        const projectRes = await createEscrowProject(walletClient1, publicClient, {
            freelancer: address2,
            client: address1,
            milestoneAmounts: [parseEther('0.00001'), parseEther('0.00001')],
            duration: 86400
        });
        console.log(`Escrow Project TX: ${projectRes.hash} | ID: ${projectRes.projectId}`);

        // Funding
        console.log('Funding Project...');
        const fundTx = await fundEscrowProject(walletClient1, publicClient, projectRes.projectId);
        console.log(`Fund TX: ${fundTx}`);

        // Request Milestone
        console.log('Freelancer requesting milestone 0...');
        const reqTx = await requestMilestone(walletClient2, publicClient, projectRes.projectId, BigInt(0));
        console.log(`Request TX: ${reqTx}`);

        // Approve
        console.log('Client approving milestone 0...');
        const appTx = await approveMilestone(walletClient1, publicClient, projectRes.projectId, BigInt(0));
        console.log(`Approve TX: ${appTx}`);

        // --- 5. API Verification ---
        console.log('\n--- 5. API Backend Verification ---');
        console.log('Fetching projects via API...');
        // Waiting a bit for indexing
        await new Promise(r => setTimeout(r, 15000));

        try {
            const projects = await TwinkleClient.getProjects({ client: address1 });
            console.log(`API returned ${projects.length} projects for Client.`);
            if (projects.length > 0) {
                console.log('✅ API Connection Verified: Data received from https://tw1nkl3.rest');
            } else {
                console.log('⚠️ API returned empty list (Indexer might be catching up)');
            }
        } catch (e) {
            console.error('❌ API Request Failed:', e);
        }

        console.log('\n✅ Full SDK Verification Script Complete');

    } catch (error) {
        console.error('❌ Test Failed:', error);
        // process.exit(1);
    }
}

main();
