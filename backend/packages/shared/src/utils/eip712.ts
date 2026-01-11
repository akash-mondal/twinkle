/**
 * EIP-712 utilities for signing and verification
 */

import { hashTypedData, recoverTypedDataAddress, type TypedDataDomain } from 'viem';
import { X402_DOMAIN, PAYMENT_INTENT_TYPES, getX402Domain } from '../constants/eip712.js';
import type { PaymentIntent } from '../types/contracts.js';

/**
 * Create typed data hash for PaymentIntent
 */
export function hashPaymentIntent(intent: PaymentIntent, chainId: number = 11155111): `0x${string}` {
  const domain = getX402Domain(chainId);

  return hashTypedData({
    domain: domain as TypedDataDomain,
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
}

/**
 * Recover signer address from PaymentIntent signature
 */
export async function recoverPaymentIntentSigner(
  intent: PaymentIntent,
  signature: `0x${string}`,
  chainId: number = 11155111
): Promise<`0x${string}`> {
  const domain = getX402Domain(chainId);

  return recoverTypedDataAddress({
    domain: domain as TypedDataDomain,
    types: PAYMENT_INTENT_TYPES,
    primaryType: 'PaymentIntent',
    message: {
      payer: intent.payer,
      requestId: intent.requestId,
      amount: intent.amount,
      validUntil: intent.validUntil,
      nonce: intent.nonce,
    },
    signature,
  });
}

/**
 * Verify PaymentIntent signature
 */
export async function verifyPaymentIntentSignature(
  intent: PaymentIntent,
  signature: `0x${string}`,
  chainId: number = 11155111
): Promise<boolean> {
  try {
    const recoveredAddress = await recoverPaymentIntentSigner(intent, signature, chainId);
    return recoveredAddress.toLowerCase() === intent.payer.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Create PaymentIntent from raw parameters
 */
export function createPaymentIntent(
  payer: `0x${string}`,
  requestId: `0x${string}`,
  amount: bigint,
  validUntil: bigint,
  nonce: bigint
): PaymentIntent {
  return {
    payer,
    requestId,
    amount,
    validUntil,
    nonce,
  };
}
