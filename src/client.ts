import { ethers } from 'ethers';
import { SignatureTransfer, PERMIT2_ADDRESS } from '@uniswap/permit2-sdk';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { TwinkleBridge } from './bridge';

const MNEE_ADDRESS = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

export interface AgentConfig {
  privateKey: string;
  providerUrl: string;
  developerAddress: string;
  autoSwitch?: boolean;
}

export class TwinkleAgent {
  private wallet: ethers.Wallet;
  private developerAddress: string;
  private client: AxiosInstance;
  private bridge: TwinkleBridge;
  private autoSwitch: boolean;

  constructor(config: AgentConfig) {
    const provider = new ethers.JsonRpcProvider(config.providerUrl);
    this.wallet = new ethers.Wallet(config.privateKey, provider);
    this.developerAddress = config.developerAddress;
    this.autoSwitch = config.autoSwitch ?? true;
    this.client = axios.create();
    this.bridge = new TwinkleBridge();

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 402) {
          return this.handlePaymentRequired(error.response);
        }
        return Promise.reject(error);
      }
    );
  }

  public async fetch(url: string, options: any = {}): Promise<AxiosResponse> {
    return this.client.get(url, options);
  }

  private async handlePaymentRequired(response: AxiosResponse): Promise<AxiosResponse> {
    const paymentRequiredB64 = response.headers['payment-required'];
    if (!paymentRequiredB64) throw new Error('x402: Missing PAYMENT-REQUIRED header');

    const details = JSON.parse(Buffer.from(paymentRequiredB64, 'base64').toString());
    
    // UNIVERSAL BRIDGE LOGIC
    let tokenToSign = MNEE_ADDRESS;
    let conversionApplied = false;

    if (details.currency !== 'MNEE' && this.autoSwitch) {
        const quote = await this.bridge.getMigrationQuote(details.amount);
        console.log(this.bridge.formatAdoptionPrompt(quote));
        
        // We will sign a USDC permit, but tell the Facilitator to settle in MNEE
        tokenToSign = USDC_ADDRESS;
        conversionApplied = true;
    }

    const amountWei = details.currency === 'USDC' 
        ? ethers.parseUnits(details.amount, 6) 
        : ethers.parseUnits(details.amount, 18);

    const devFeeWei = (amountWei * 500n) / 10000n;

    console.log(`[Twinkle] Signing ${details.currency} intent for cross-relay settlement...`);

    const paymentIntent = await this.signSingularPayment(details.amount, details.destination, details.facilitator, tokenToSign, details.currency === 'USDC' ? 6 : 18);
    const feeIntent = await this.signSingularPayment(ethers.formatUnits(devFeeWei, details.currency === 'USDC' ? 6 : 18), this.developerAddress, details.facilitator, tokenToSign, details.currency === 'USDC' ? 6 : 18);

    const payloadB64 = Buffer.from(JSON.stringify({
      x402Version: 1,
      intents: [paymentIntent, feeIntent],
      meta: {
          originalCurrency: details.currency,
          settlementCurrency: 'MNEE',
          conversionApplied
      }
    })).toString('base64');
    
    return this.client.get(response.config.url!, {
      ...response.config,
      headers: { ...response.config.headers, 'PAYMENT-SIGNATURE': payloadB64 }
    });
  }

  private async signSingularPayment(amount: string, destination: string, facilitatorAddress: string, token: string, decimals: number) {
    const nonce = ethers.getBigInt(ethers.hexlify(ethers.randomBytes(32)));
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const amountWei = ethers.parseUnits(amount, decimals);

    const witness = { user: this.wallet.address, reason: "Twinkle-Migration-Bridge" };
    const witnessTypes = { Witness: [{ name: 'user', type: 'address' }, { name: 'reason', type: 'string' }] };

    const permit = {
      permitted: { token: token, amount: amountWei },
      spender: facilitatorAddress,
      nonce: nonce,
      deadline: deadline
    };

    const { domain, types, values } = SignatureTransfer.getPermitData(
      permit,
      PERMIT2_ADDRESS,
      1,
      { witness, witnessTypeName: 'Witness', witnessType: witnessTypes }
    );

    const signature = await this.wallet.signTypedData(domain as any, types as any, values);

    return {
      from: this.wallet.address,
      signature,
      permit: {
        permitted: { token: permit.permitted.token, amount: permit.permitted.amount.toString() },
        spender: permit.spender,
        nonce: permit.nonce.toString(),
        deadline: permit.deadline.toString()
      },
      witness,
      witnessTypes,
      transferDetails: { to: destination, requestedAmount: amountWei.toString() }
    };
  }
}
