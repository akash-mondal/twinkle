import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { SignatureTransfer, PERMIT2_ADDRESS } from '@uniswap/permit2-sdk';

export interface ServerConfig {
  price: string;
  currency: string;
  destinationAddress: string;
  facilitatorAddress: string;
  chainId?: number;
}

export class TwinkleServer {
  private config: ServerConfig;
  private chainId: number;

  constructor(config: ServerConfig) {
    this.config = config;
    this.chainId = config.chainId || 1;
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const paymentSignatureB64 = req.headers['payment-signature'];

      if (!paymentSignatureB64) {
        const paymentDetails = Buffer.from(JSON.stringify({
          x402Version: 1,
          scheme: 'exact',
          amount: this.config.price,
          destination: this.config.destinationAddress,
          facilitator: this.config.facilitatorAddress,
          network: 'ethereum-mainnet',
          currency: this.config.currency,
        })).toString('base64');

        res.status(402).set('PAYMENT-REQUIRED', paymentDetails).send('Payment Required: MNEE');
        return;
      }

      try {
        const payload = JSON.parse(Buffer.from(paymentSignatureB64 as string, 'base64').toString());
        
        // Verify multiple intents
        for (const intent of payload.intents) {
           const isValid = this.verifySignature(intent);
           if (!isValid) {
             res.status(401).send('Unauthorized: Invalid Payment Signature in Batch');
             return;
           }
        }

        console.log(`[Twinkle] Validated V2 Dual Signature from ${payload.intents[0].from}`);
        
        res.set('PAYMENT-RESPONSE', Buffer.from(JSON.stringify({
          status: 'success',
          settlement: 'off-chain-verified'
        })).toString('base64'));

        (req as any).payment = payload;
        next();
      } catch (err) {
        console.error('[Twinkle] Verification Error:', err);
        res.status(400).send('Invalid Payment Intent format');
      }
    };
  }

  private verifySignature(intent: any): boolean {
    try {
      const { signature, from, permit, witness, witnessTypes } = intent;

      const { domain, types, values } = SignatureTransfer.getPermitData(
        permit,
        PERMIT2_ADDRESS,
        this.chainId,
        {
          witness,
          witnessTypeName: 'Witness',
          witnessType: witnessTypes
        }
      );

      const recoveredSigner = ethers.verifyTypedData(domain as any, types as any, values, signature);
      return recoveredSigner.toLowerCase() === from.toLowerCase();
    } catch (err) {
      return false;
    }
  }
}
