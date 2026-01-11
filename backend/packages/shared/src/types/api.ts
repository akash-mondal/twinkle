/**
 * API request/response types
 */

/**
 * x402 Payment verification request
 */
export interface VerifyPaymentRequest {
  paymentPayload: {
    x402Version: number;
    scheme: 'exact';
    network: string;
    payload: {
      signature: `0x${string}`;
      authorization: {
        payer: `0x${string}`;
        requestId: `0x${string}`;
        amount: string;
        validUntil: string;
        nonce: string;
      };
    };
  };
  paymentRequirements: {
    scheme: 'exact';
    network: string;
    maxAmountRequired: string;
    resource: string;
    payTo: `0x${string}`;
    maxTimeoutSeconds: number;
    asset: `0x${string}`;
  };
}

/**
 * x402 Payment verification response
 */
export interface VerifyPaymentResponse {
  valid: boolean;
  invalidReason?: string;
  payer?: `0x${string}`;
  amount?: string;
}

/**
 * x402 Settlement request
 */
export interface SettlePaymentRequest {
  paymentPayload: VerifyPaymentRequest['paymentPayload'];
  paymentRequirements: VerifyPaymentRequest['paymentRequirements'];
}

/**
 * x402 Settlement response
 */
export interface SettlePaymentResponse {
  success: boolean;
  transactionHash?: `0x${string}`;
  accessProofId?: `0x${string}`;
  error?: string;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Payment history item
 */
export interface PaymentHistoryItem {
  txHash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  amount: string;
  token: `0x${string}`;
  timestamp: number;
  blockNumber: number;
  type: 'direct' | 'paywall' | 'subscription' | 'escrow' | 'x402';
  metadata?: Record<string, unknown>;
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
  event: string;
  timestamp: number;
  data: Record<string, unknown>;
  signature: string;
}
