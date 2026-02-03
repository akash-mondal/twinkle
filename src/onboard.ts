import { ethers } from 'ethers';

const MNEE_ADDRESS = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

/**
 * Higher-level onboarding helper
 */
export async function bootAgent(privateKey: string, providerUrl: string) {
    console.log("🛠️  Agent Bootstrapper Sequence Initialized...");
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const abi = [
        "function allowance(address,address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)"
    ];

    const mnee = new ethers.Contract(MNEE_ADDRESS, abi, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, abi, wallet);

    // 1. Check MNEE
    console.log(`[Boot] Checking MNEE Permit2 allowance...`);
    const mneeAllowance = await mnee.allowance(wallet.address, PERMIT2_ADDRESS);
    if (mneeAllowance === 0n) {
        console.log("[Boot] Approving MNEE for Permit2...");
        const tx = await mnee.approve(PERMIT2_ADDRESS, ethers.MaxUint256);
        console.log(`[Boot] MNEE Approval Tx: ${tx.hash}`);
        await tx.wait();
    } else {
        console.log("[Boot] MNEE already approved.");
    }

    // 2. Check USDC
    console.log(`[Boot] Checking USDC Permit2 allowance...`);
    const usdcAllowance = await usdc.allowance(wallet.address, PERMIT2_ADDRESS);
    if (usdcAllowance === 0n) {
        console.log("[Boot] Approving USDC for Permit2...");
        const tx = await usdc.approve(PERMIT2_ADDRESS, ethers.MaxUint256);
        console.log(`[Boot] USDC Approval Tx: ${tx.hash}`);
        await tx.wait();
        console.log("[Boot] USDC Approved.");
    } else {
        console.log("[Boot] USDC already approved.");
    }

    console.log("✅ Agent is now MNEE & USDC TWINKLE-ENABLED.");
    return {
        address: wallet.address,
        ready: true
    };
}
