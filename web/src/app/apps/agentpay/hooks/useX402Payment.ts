'use client';

import { useState, useCallback } from 'react';
import { useAccount, useSignTypedData, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import type { PaymentRequest } from './useAgentChat';

const FACILITATOR_URL = process.env.NEXT_PUBLIC_FACILITATOR_URL || 'http://159.89.160.130/facilitator/1';

// MNEE token address on Mainnet
const MNEE_ADDRESS = '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF' as const;

// TwinkleX402 contract address on Mainnet
const X402_ADDRESS = '0x348356f71539CCc13695a4868541B9bC18764A0F' as const;

// EIP-712 Domain
const X402_DOMAIN = {
  name: 'TwinkleX402',
  version: '2',
  chainId: 1, // Ethereum Mainnet
  verifyingContract: X402_ADDRESS,
} as const;

// EIP-712 Types for PaymentIntent
const PAYMENT_INTENT_TYPES = {
  PaymentIntent: [
    { name: 'payer', type: 'address' },
    { name: 'requestId', type: 'bytes32' },
    { name: 'amount', type: 'uint256' },
    { name: 'validUntil', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

// Generate random nonce
function generateNonce(): bigint {
  return BigInt(Math.floor(Math.random() * 1000000000));
}

// Convert string to bytes32
function stringToBytes32(str: string): `0x${string}` {
  // If it's already a hex string, return it
  if (str.startsWith('0x') && str.length === 66) {
    return str as `0x${string}`;
  }
  // Otherwise, convert UUID to bytes32
  const hex = str.replace(/-/g, '');
  return `0x${hex.padEnd(64, '0')}` as `0x${string}`;
}

export interface PaymentResult {
  success: boolean;
  accessProofId?: string;
  txHash?: string;
  error?: string;
}

export function useX402Payment() {
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();

  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signAndSettle = useCallback(async (paymentRequest: PaymentRequest): Promise<PaymentResult> => {
    if (!address || !isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsPaying(true);
    setError(null);

    try {
      const nonce = generateNonce();
      const requestIdBytes = stringToBytes32(paymentRequest.requestId);
      const amount = parseUnits(paymentRequest.amount, 18); // MNEE has 18 decimals

      // Sign the PaymentIntent with EIP-712
      const signature = await signTypedDataAsync({
        domain: X402_DOMAIN,
        types: PAYMENT_INTENT_TYPES,
        primaryType: 'PaymentIntent',
        message: {
          payer: address,
          requestId: requestIdBytes,
          amount,
          validUntil: BigInt(paymentRequest.validUntil),
          nonce,
        },
      });

      // Submit to facilitator for settlement
      const response = await fetch(`${FACILITATOR_URL}/settle-ap2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          intent: {
            payer: address,
            requestId: paymentRequest.requestId,
            amount: paymentRequest.amount,
            validUntil: paymentRequest.validUntil,
            nonce: nonce.toString(),
          },
          agentInfo: {
            agentId: 'agentpay',
            agentType: 'crypto-data',
            sessionId: paymentRequest.requestId,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Settlement failed' }));
        throw new Error(errorData.error || `Settlement failed: ${response.status}`);
      }

      const result = await response.json();

      setIsPaying(false);
      return {
        success: true,
        accessProofId: result.accessProofId,
        txHash: result.txHash,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      setIsPaying(false);

      // Check if user rejected
      if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
        return { success: false, error: 'Transaction rejected by user' };
      }

      return { success: false, error: errorMessage };
    }
  }, [address, isConnected, signTypedDataAsync]);

  // Direct contract call as fallback
  const directPay = useCallback(async (paymentRequest: PaymentRequest): Promise<PaymentResult> => {
    if (!address || !isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsPaying(true);
    setError(null);

    try {
      const amount = parseUnits(paymentRequest.amount, 18);
      const requestIdBytes = stringToBytes32(paymentRequest.requestId);

      // First approve MNEE spending
      const approveTx = await writeContractAsync({
        address: MNEE_ADDRESS,
        abi: [
          {
            name: 'approve',
            type: 'function',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            outputs: [{ type: 'bool' }],
          },
        ],
        functionName: 'approve',
        args: [X402_ADDRESS, amount],
      });

      // Then call settle on X402
      const settleTx = await writeContractAsync({
        address: X402_ADDRESS,
        abi: [
          {
            name: 'settle',
            type: 'function',
            inputs: [
              { name: 'requestId', type: 'bytes32' },
            ],
            outputs: [],
          },
        ],
        functionName: 'settle',
        args: [requestIdBytes],
      });

      setIsPaying(false);
      return {
        success: true,
        txHash: settleTx,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      setIsPaying(false);
      return { success: false, error: errorMessage };
    }
  }, [address, isConnected, writeContractAsync]);

  return {
    signAndSettle,
    directPay,
    isPaying,
    error,
    isConnected,
    address,
  };
}
