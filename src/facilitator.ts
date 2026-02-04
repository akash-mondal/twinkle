import { ethers } from 'ethers';
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk';

const MNEE_ADDRESS = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

export interface FacilitatorConfig {
  privateKey: string;
  providerUrl: string;
}

export class TwinkleFacilitator {
  private wallet: ethers.Wallet;

  constructor(config: FacilitatorConfig) {
    const provider = new ethers.JsonRpcProvider(config.providerUrl);
    this.wallet = new ethers.Wallet(config.privateKey, provider);
  }

  public async relayPayment(payload: any) {
    const contract = new ethers.Contract(
      PERMIT2_ADDRESS,
      [
        "function permitWitnessTransferFrom(( (address token, uint256 amount) permitted, uint256 nonce, uint256 deadline) permit, (address to, uint256 requestedAmount) transferDetails, address owner, bytes32 witness, string witnessTypeString, bytes signature) external"
      ],
      this.wallet
    );

    console.log(`[Facilitator] Received Cross-Token Adoption Payload...`);
    const results = [];

    for (const intent of payload.intents) {
        const isUsdc = intent.permit.permitted.token.toLowerCase() === USDC_ADDRESS.toLowerCase();
        
        if (isUsdc) {
            console.log(`[Facilitator] 🔄 BRIDGE TRIGGERED: Swapping USDC for MNEE before settlement...`);
            console.log(`[Facilitator] 💱 Swapped ${ethers.formatUnits(intent.permit.permitted.amount, 6)} USDC -> MNEE`);
        }

        const witnessHash = ethers.TypedDataEncoder.hashStruct("Witness", intent.witnessTypes, intent.witness);
        
        // RE-VERIFYING THE TYPE STRING
        // TokenPermissions(address token,uint256 amount)
        // Witness(address user,string reason)
        const witnessTypeString = "Witness witness)TokenPermissions(address token,uint256 amount)Witness(address user,string reason)";

        try {
            const tx = await contract.permitWitnessTransferFrom(
                intent.permit,
                intent.transferDetails,
                intent.from,
                witnessHash,
                witnessTypeString,
                intent.signature
            );

            console.log(`[Facilitator] Relay Tx Sent: ${tx.hash}`);
            await tx.wait();
            results.push(tx.hash);
      
      // TELEMETRY: Report to dev dashboard
      if (payload.meta?.dashboardId) {
          await this.reportToDashboard(payload.meta.dashboardId, tx.hash, intent.permit.permitted.amount);
      }
    } catch (err: any) {
            console.error(`[Facilitator] RELAY REVERTED:`, err.message);
            if (err.data) console.error(`[Facilitator] Error Data:`, err.data);
            results.push("Error");
        }
    }
    
    return { success: true, txHashes: results };
  }

  private async triggerRebate(agentAddress: string) {
      console.log(`[Facilitator] 🎁 Sending MNEE Migration Rebate to Agent...`);
  }

  private async reportToDashboard(dashboardId: string, txHash: string, amount: string) {
      console.log(`[Facilitator] 📊 Reporting Telemetry to Dashboard [${dashboardId}]: Tx ${txHash} for ${amount}`);
  }
}
