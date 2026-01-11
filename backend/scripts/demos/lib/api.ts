/**
 * API Client for Twinkle Protocol
 * Wraps all REST endpoints for easy access
 */

import { CONFIG } from './config.js';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * Base API client with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const url = `${CONFIG.apiUrl}${endpoint}`;
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`API Error ${response.status}: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  // API wraps list responses in { data: [...] }
  if (result && typeof result === 'object' && 'data' in result) {
    return result.data as T;
  }
  return result;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  checks: {
    redis: { status: string };
    database: { status: string };
  };
}

/**
 * Paywall data from API
 */
export interface Paywall {
  id: string;
  creator: string;
  price: string;
  splitAddress: string | null;
  totalUnlocks: number;
  totalRevenue: string;
  active: boolean;
  x402Enabled: boolean;
  createdAt: string;
}

/**
 * Subscription plan data
 */
export interface SubscriptionPlan {
  id: string;
  creator: string;
  price: string;
  interval: number;
  gracePeriod: number;
  active: boolean;
  totalSubscribers: number;
  createdAt: string;
}

/**
 * User subscription data
 */
export interface UserSubscription {
  planId: string;
  subscriber: string;
  startTime: string;
  lastPayment: string;
  active: boolean;
  expiresAt: string;
}

/**
 * Project/Escrow data
 */
export interface Project {
  id: string;
  client: string;
  freelancer: string;
  totalBudget: string;
  released: string;
  status: string;
  milestones: Milestone[];
  createdAt: string;
}

export interface Milestone {
  description: string;
  amount: string;
  status: string;
  completedAt?: string;
}

/**
 * Split data
 */
export interface Split {
  id: string;
  creator: string;
  recipients: SplitRecipient[];
  totalDeposited: string;
  totalDistributed: string;
  createdAt: string;
}

export interface SplitRecipient {
  address: string;
  share: number;
  amountReceived: string;
}

/**
 * X402 Payment request
 */
export interface X402Request {
  requestId: string;
  payTo: string;
  amount: string;
  paywallId: string;
  validUntil: string;
  settled: boolean;
  creator: string;
  createdAt: string;
}

/**
 * X402 Settlement data
 */
export interface X402Settlement {
  requestId: string;
  payer: string;
  payTo: string;
  amount: string;
  platformFee: string;
  accessProofId: string;
  settledAt: string;
  txHash: string;
}

/**
 * Analytics data
 */
export interface AnalyticsOverview {
  totalPayments: number;
  totalVolume: string;
  activePaywalls: number;
  activeSubscriptions: number;
  totalUsers: number;
}

export interface DailyAnalytics {
  date: string;
  payments: number;
  volume: string;
  newPaywalls: number;
  newSubscriptions: number;
}

/**
 * Twinkle API Client
 */
export class TwinkleAPI {
  // ===== Health & Status =====

  async health(): Promise<HealthResponse> {
    return fetchApi('/health');
  }

  async metrics(): Promise<string> {
    const response = await fetch(`${CONFIG.apiUrl}/metrics`);
    return response.text();
  }

  // ===== Paywalls =====

  async getPaywalls(params?: {
    creator?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Paywall[]> {
    const searchParams = new URLSearchParams();
    if (params?.creator) searchParams.set('creator', params.creator);
    if (params?.active !== undefined) searchParams.set('active', String(params.active));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return fetchApi(`/paywalls${query ? `?${query}` : ''}`);
  }

  async getPaywall(id: string): Promise<Paywall | null> {
    try {
      return await fetchApi(`/paywalls/${id}`);
    } catch {
      return null;
    }
  }

  async checkUnlock(paywallId: string, address: string): Promise<{ unlocked: boolean }> {
    return fetchApi(`/paywalls/${paywallId}/check/${address}`);
  }

  // ===== Subscriptions =====

  async getPlans(params?: {
    creator?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<SubscriptionPlan[]> {
    const searchParams = new URLSearchParams();
    if (params?.creator) searchParams.set('creator', params.creator);
    if (params?.active !== undefined) searchParams.set('active', String(params.active));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return fetchApi(`/subscriptions/plans${query ? `?${query}` : ''}`);
  }

  async getPlan(id: string): Promise<SubscriptionPlan | null> {
    try {
      return await fetchApi(`/subscriptions/plans/${id}`);
    } catch {
      return null;
    }
  }

  async getUserSubscriptions(address: string): Promise<UserSubscription[]> {
    return fetchApi(`/subscriptions/user/${address}`);
  }

  async checkSubscription(
    planId: string,
    address: string
  ): Promise<{ active: boolean; expiresAt?: string }> {
    return fetchApi(`/subscriptions/plans/${planId}/check/${address}`);
  }

  // ===== Projects (Escrow) =====

  async getProjects(params?: {
    client?: string;
    freelancer?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Project[]> {
    const searchParams = new URLSearchParams();
    if (params?.client) searchParams.set('client', params.client);
    if (params?.freelancer) searchParams.set('freelancer', params.freelancer);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return fetchApi(`/projects${query ? `?${query}` : ''}`);
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      return await fetchApi(`/projects/${id}`);
    } catch {
      return null;
    }
  }

  // ===== Splits =====

  async getSplits(params?: {
    creator?: string;
    limit?: number;
    offset?: number;
  }): Promise<Split[]> {
    const searchParams = new URLSearchParams();
    if (params?.creator) searchParams.set('creator', params.creator);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return fetchApi(`/splits${query ? `?${query}` : ''}`);
  }

  async getSplit(id: string): Promise<Split | null> {
    try {
      return await fetchApi(`/splits/${id}`);
    } catch {
      return null;
    }
  }

  // ===== X402 =====

  async getX402Requests(params?: {
    creator?: string;
    settled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<X402Request[]> {
    const searchParams = new URLSearchParams();
    if (params?.creator) searchParams.set('creator', params.creator);
    if (params?.settled !== undefined) searchParams.set('settled', String(params.settled));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return fetchApi(`/x402/requests${query ? `?${query}` : ''}`);
  }

  async getX402Request(requestId: string): Promise<X402Request | null> {
    try {
      return await fetchApi(`/x402/requests/${requestId}`);
    } catch {
      return null;
    }
  }

  async getX402Settlements(params?: {
    payer?: string;
    limit?: number;
    offset?: number;
  }): Promise<X402Settlement[]> {
    const searchParams = new URLSearchParams();
    if (params?.payer) searchParams.set('payer', params.payer);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return fetchApi(`/x402/settlements${query ? `?${query}` : ''}`);
  }

  // ===== Payments =====

  async getPayments(params?: {
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<unknown[]> {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return fetchApi(`/payments${query ? `?${query}` : ''}`);
  }

  async getPayment(txHash: string): Promise<unknown | null> {
    try {
      return await fetchApi(`/payments/${txHash}`);
    } catch {
      return null;
    }
  }

  // ===== Analytics =====

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    return fetchApi('/analytics/overview');
  }

  async getDailyAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DailyAnalytics[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const query = searchParams.toString();
    return fetchApi(`/analytics/daily${query ? `?${query}` : ''}`);
  }
}

// Export singleton instance
export const api = new TwinkleAPI();
