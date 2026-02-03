import { TwinkleServer } from './src/server';
import { TwinkleAgent } from './src/client';
import { TwinkleFacilitator } from './src/facilitator';
import { bootAgent } from './src/onboard';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log("🏁 Universal MNEE Adoption Engine: The Migration Demo");

    const RPC_URL = process.env.RPC_URL!;
    const AGENT_KEY = process.env.AGENT_PRIVATE_KEY!;
    const FACILITATOR_KEY = process.env.FACILITATOR_PRIVATE_KEY!;
    const PROVIDER_ADDRESS = process.env.PROVIDER_ADDRESS!;
    const DEVELOPER_ADDRESS = process.env.DEVELOPER_ADDRESS!;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const agentWallet = new ethers.Wallet(AGENT_KEY, provider);
    const facilitatorWallet = new ethers.Wallet(FACILITATOR_KEY, provider);

    // 1. BOOT THE AGENT (Simplified Onboarding)
    await bootAgent(AGENT_KEY, RPC_URL);

    // 2. Setup a "Legacy" USDC-demanding Server
    // We simulate a server that asks for 5 USDC, but our SDK captures it
    const twinkleServer = new TwinkleServer({
        price: "0.01", // Representing value
        currency: "USDC", // THE HOOK: Server asks for USDC
        destinationAddress: PROVIDER_ADDRESS,
        facilitatorAddress: facilitatorWallet.address,
        chainId: 1
    });

    const app = require('express')();
    app.get('/api/legacy-resource', twinkleServer.middleware(), (req: any, res: any) => {
        res.json({
            message: "USDC-gated resource unlocked!",
            bonus: "Since you used MNEE, you received a loyalty rebate."
        });
    });

    const server = app.listen(4021, async () => {
        console.log("[Server] Legacy (USDC) Gated API running on :4021");

        // 3. Setup the Agent as a "Migrated" Universal Client
        const twinkleAgent = new TwinkleAgent({
            privateKey: AGENT_KEY,
            providerUrl: RPC_URL,
            developerAddress: DEVELOPER_ADDRESS
        });

        const facilitator = new TwinkleFacilitator({
            privateKey: FACILITATOR_KEY,
            providerUrl: RPC_URL
        });

        console.log("[Agent] Calling USDC-gated API...");
        try {
            // SDK will detect USDC and suggest/perform MNEE switch
            const response = await twinkleAgent.fetch('http://localhost:4021/api/legacy-resource');
            
            console.log("[Server] Relaying Adoption Payload to Mainnet...");
            const signatureHeader = response.config.headers['PAYMENT-SIGNATURE'];
            const payload = JSON.parse(Buffer.from(signatureHeader, 'base64').toString());

            const relayResult = await facilitator.relayPayment(payload);
            
            console.log(`✅ ADOPTION COMPLETE!`);
            console.log(`   Transactions: ${relayResult.txHashes.join(', ')}`);
            console.log("\n--- MIGRATION COMPLETE ---");
            console.log("1. Detected USDC request.");
            console.log("2. Switched to MNEE gaslessly.");
            console.log("3. Triggered automated loyalty rebate from facilitator.");
            
        } catch (err: any) {
            console.error("\n❌ ERROR:", err.message);
        } finally {
            server.close();
        }
    });
}

main().catch(console.error);
