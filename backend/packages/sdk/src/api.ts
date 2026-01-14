/**
 * API Client for Twinkle Indexer
 */

import { SDK_CONFIG } from './config.js';

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

export interface UserSubscription {
    planId: string;
    subscriber: string;
    startTime: string;
    lastPayment: string;
    active: boolean;
    expiresAt: string;
}

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

// ... Additional interfaces can be added as needed

export class TwinkleAPI {
    private customBaseUrl?: string;

    constructor(baseUrl?: string) {
        this.customBaseUrl = baseUrl;
    }

    private get baseUrl() {
        return this.customBaseUrl || SDK_CONFIG.apiUrl;
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (result && typeof result === 'object' && 'data' in result) {
            return result.data as T;
        }
        return result as T;
    }

    // ===== Paywalls =====

    async getPaywalls(params?: Record<string, any>): Promise<Paywall[]> {
        const query = new URLSearchParams(params).toString();
        return this.fetch(`/paywalls${query ? `?${query}` : ''}`);
    }

    async getPaywall(id: string): Promise<Paywall | null> {
        try {
            return await this.fetch(`/paywalls/${id}`);
        } catch {
            return null;
        }
    }

    async checkUnlock(paywallId: string, address: string): Promise<{ unlocked: boolean }> {
        return this.fetch(`/paywalls/${paywallId}/check/${address}`);
    }

    // ===== Subscriptions =====

    async getPlans(params?: Record<string, any>): Promise<SubscriptionPlan[]> {
        const query = new URLSearchParams(params).toString();
        return this.fetch(`/subscriptions/plans${query ? `?${query}` : ''}`);
    }

    async getUserSubscriptions(address: string): Promise<UserSubscription[]> {
        return this.fetch(`/subscriptions/user/${address}`);
    }

    // ===== Projects =====

    async getProjects(params?: Record<string, any>): Promise<Project[]> {
        const query = new URLSearchParams(params).toString();
        return this.fetch(`/projects${query ? `?${query}` : ''}`);
    }

    async getProject(id: string): Promise<Project | null> {
        try {
            return await this.fetch(`/projects/${id}`);
        } catch {
            return null;
        }
    }

    // ===== General =====

    async health(): Promise<any> {
        return this.fetch('/health');
    }
}

// Export singleton that uses global config
export const api = new TwinkleAPI();
