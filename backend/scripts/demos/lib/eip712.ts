/**
 * EIP-712 Typed Data Signing for TwinkleX402
 * Used for signing payment intents in the x402 protocol
 */

import {
  type WalletClient,
  type PublicClient,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
} from 'viem';
import { CONFIG } from './config.js';

/**
 * EIP-712 Domain for TwinkleX402
 * MUST match the contract's domain exactly
 */
export const X402_DOMAIN = {
  name: 'TwinkleX402',
  version: '2',
  chainId: CONFIG.chainId,
  verifyingContract: CONFIG.contracts.TwinkleX402,
} as const;

/**
 * EIP-712 Types for PaymentIntent
 * Order and types must match contract exactly
 */
export const PAYMENT_INTENT_TYPES = {
  PaymentIntent: [
    { name: 'payer', type: 'address' },
    { name: 'requestId', type: 'bytes32' },
    { name: 'amount', type: 'uint256' },
    { name: 'validUntil', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

/**
 * PaymentIntent structure
 */
export interface PaymentIntent {
  payer: `0x${string}`;
  requestId: `0x${string}`;
  amount: bigint;
  validUntil: bigint;
  nonce: bigint;
}

/**
 * Sign a PaymentIntent using EIP-712
 */
export async function signPaymentIntent(
  walletClient: WalletClient,
  intent: PaymentIntent
): Promise<`0x${string}`> {
  const signature = await walletClient.signTypedData({
    domain: X402_DOMAIN,
    types: PAYMENT_INTENT_TYPES,
    primaryType: 'PaymentIntent',
    message: {
      payer: intent.payer,
      requestId: intent.requestId,
      amount: intent.amount,
      validUntil: intent.validUntil,
      nonce: intent.nonce,
    },
  });

  return signature;
}

/**
 * Generate a unique nonce (can be random or sequential)
 */
export function generateNonce(): bigint {
  // Use timestamp + random for uniqueness
  const timestamp = BigInt(Date.now());
  const random = BigInt(Math.floor(Math.random() * 1000000));
  return timestamp * 1000000n + random;
}

/**
 * Create a PaymentIntent from request data
 */
export function createPaymentIntent(params: {
  payer: `0x${string}`;
  requestId: `0x${string}`;
  amount: bigint;
  validUntil?: bigint;
  nonce?: bigint;
}): PaymentIntent {
  const validUntil =
    params.validUntil ||
    BigInt(Math.floor(Date.now() / 1000) + CONFIG.defaults.validityPeriod);

  return {
    payer: params.payer,
    requestId: params.requestId,
    amount: params.amount,
    validUntil,
    nonce: params.nonce || generateNonce(),
  };
}

/**
 * Encode a PaymentIntent for hashing
 */
export function encodePaymentIntent(intent: PaymentIntent): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters('address, bytes32, uint256, uint256, uint256'),
    [
      intent.payer,
      intent.requestId,
      intent.amount,
      intent.validUntil,
      intent.nonce,
    ]
  );
}

/**
 * Compute the struct hash for a PaymentIntent
 */
export function computePaymentIntentHash(intent: PaymentIntent): `0x${string}` {
  const typeHash = keccak256(
    new TextEncoder().encode(
      'PaymentIntent(address payer,bytes32 requestId,uint256 amount,uint256 validUntil,uint256 nonce)'
    )
  );

  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32, address, bytes32, uint256, uint256, uint256'),
    [
      typeHash,
      intent.payer,
      intent.requestId,
      intent.amount,
      intent.validUntil,
      intent.nonce,
    ]
  );

  return keccak256(encoded);
}

/**
 * Build the full x402 payment header payload
 * This would be sent as the X-PAYMENT header in HTTP requests
 */
export interface X402PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

export function buildX402Payload(
  intent: PaymentIntent,
  signature: `0x${string}`,
  payTo: `0x${string}`
): X402PaymentPayload {
  return {
    x402Version: 1,
    scheme: 'exact',
    network: `eip155:${CONFIG.chainId}`,
    payload: {
      signature,
      authorization: {
        from: intent.payer,
        to: payTo,
        value: intent.amount.toString(),
        validAfter: '0', // Valid immediately
        validBefore: intent.validUntil.toString(),
        nonce: intent.nonce.toString(),
      },
    },
  };
}

/**
 * Encode the X402 payment payload to base64 for the header
 */
export function encodeX402Header(payload: X402PaymentPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString('base64');
}

/**
 * Decode an X402 payment header
 */
export function decodeX402Header(header: string): X402PaymentPayload {
  const json = Buffer.from(header, 'base64').toString('utf-8');
  return JSON.parse(json);
}
