import { TwinkleServer } from './src/server';
import { TwinkleAgent } from './src/client';
import { TwinkleFacilitator } from './src/facilitator';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const MNEE_ADDRESS = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF';
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

async function main() {
    console.log("🚀 Initializing Twinkle Power Demo on Mainnet...");

    const RPC_URL = process.env.RPC_URL!;
    const AGENT_KEY = process.env.AGENT_PRIVATE_KEY!;
    const FACILITATOR_KEY = process.env.FACILITATOR_PRIVATE_KEY!;
    const PROVIDER_ADDRESS = process.env.PROVIDER_ADDRESS!;
    const DEVELOPER_ADDRESS = process.env.DEVELOPER_ADDRESS!;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const agentWallet = new ethers.Wallet(AGENT_KEY, provider);
    const facilitatorWallet = new ethers.Wallet(FACILITATOR_KEY, provider);

    console.log(`Agent: ${agentWallet.address}`);

    // Check Permit2 Approval
    const mnee = new ethers.Contract(MNEE_ADDRESS, [
        "function allowance(address,address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)"
    ], agentWallet);

    const allowance = await mnee.allowance(agentWallet.address, PERMIT2_ADDRESS);
    if (allowance === 0n) {
        console.log("[Permit2] Approving one-time...");
        const tx = await mnee.approve(PERMIT2_ADDRESS, ethers.MaxUint256);
        await tx.wait();
        console.log("[Permit2] Approved!");
    } else {
        console.log("[Permit2] Already approved.");
    }

    // 1. Setup the Gated API (Service Provider)
    const twinkleServer = new TwinkleServer({
        price: "0.01", // 0.01 MNEE per request
        currency: "MNEE",
        destinationAddress: PROVIDER_ADDRESS,
        facilitatorAddress: facilitatorWallet.address,
        chainId: 1 // Mainnet
    });

    const app = require('express')();
    app.get('/api/resource', twinkleServer.middleware(), (req: any, res: any) => {
        res.json({
            message: "Premium Content Unlocked!",
            data: "This resource was paid for with gasless MNEE.",
            facilitatorReceipt: req.payment.txHashes // Validated dual-relay
        });
    });

    const server = app.listen(4020, async () => {
        console.log("[Server] Gated API running on :4020");

        // 2. Setup the Agent (Client)
        const twinkleAgent = new TwinkleAgent({
            privateKey: AGENT_KEY,
            providerUrl: RPC_URL,
            developerAddress: DEVELOPER_ADDRESS
        });

        // 3. Setup the Facilitator (Relay)
        const facilitator = new TwinkleFacilitator({
            privateKey: FACILITATOR_KEY,
            providerUrl: RPC_URL
        });

        console.log("[Agent] Calling gated API...");
        try {
            const response = await twinkleAgent.fetch('http://localhost:4020/api/resource');
            
            console.log("[Server] Relaying Dual Intents to Mainnet via Facilitator...");
            const signatureHeader = response.config.headers['PAYMENT-SIGNATURE'];
            const payload = JSON.parse(Buffer.from(signatureHeader, 'base64').toString());

            const relayResult = await facilitator.relayPayment(payload);
            
            console.log(`✅ SUCCESS! Transfers Confirmed.`);
            relayResult.txHashes.forEach((hash: string, i: number) => {
                console.log(`   Tx ${i+1}: https://etherscan.io/tx/${hash}`);
            });
            
            console.log("\n--- DEMO COMPLETE ---");
            console.log("Resource unlocked and 5% Twinkle fee split confirmed on Mainnet via Witness+Permit2.");
            
        } catch (err: any) {
            console.error("\n❌ ERROR:", err.message);
            if (err.response) {
                console.error("[Agent] Server Response:", err.response.data);
            }
        } finally {
            console.log("\n[Demo] Closing connections...");
            server.close();
        }
    });
}

main().catch(console.error);
