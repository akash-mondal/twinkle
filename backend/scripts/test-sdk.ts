
import { initTwinkle, createPublicClientInstance, TWINKLE_ESCROW_ABI, SDK_CONFIG } from '../packages/sdk/src/index.js';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const TEST_PROJECT_ID = '0x127bbdc136205b794342af83a784f7c167120bb0ac4a626ef65c923dc53d6ffa'; // Mainnet project from demo

async function main() {
    console.log('🧪 Testing @twinkle/sdk...');

    // 1. Initialize SDK
    initTwinkle({
        chainId: 1, // Mainnet
        rpcUrl: process.env.RPC_URL || 'https://ethereum.publicnode.com'
    });
    console.log('✅ SDK Initialized for Chain ID:', SDK_CONFIG.chainId);

    // 2. Create Clients
    const publicClient = createPublicClientInstance();
    console.log('✅ Public Client Created');

    // 3. Test Contract Interaction (Read)
    console.log(`🔍 Fetching Project: ${TEST_PROJECT_ID}`);
    try {
        const project = await publicClient.readContract({
            address: SDK_CONFIG.contracts.TwinkleEscrow,
            abi: TWINKLE_ESCROW_ABI,
            functionName: 'getProject',
            args: [TEST_PROJECT_ID as `0x${string}`]
        });

        console.log('✅ Project Data Retrieved:', {
            freelancer: project[0],
            client: project[1],
            status: project[2],
            totalAmount: project[3],
        });
    } catch (error) {
        console.error('❌ Error fetching project:', error);
        process.exit(1);
    }

    // 4. Test Wallet Keys (just check if environment is ready for write tests)
    if (process.env.TEST_PRIVATE_KEY) {
        console.log('🔑 TEST_PRIVATE_KEY is present (Write tests possible)');
    } else {
        console.log('⚠️ TEST_PRIVATE_KEY missing (Skipping write tests)');
    }

    console.log('🎉 SDK Verification Complete!');
}

main().catch(console.error);
