'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Heart, Plus, Copy, Check, ExternalLink, Users, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { keccak256, toHex } from 'viem';
import { useMyPlans, Plan } from '@/hooks/usePlans';
import { usePlan, parsePlanData, formatInterval } from '@/hooks/useSubscription';

// Component to show on-chain stats for a plan
function PlanStats({ planId }: { planId: string }) {
  const fullId = keccak256(toHex(planId)) as `0x${string}`;
  const { data, isLoading } = usePlan(fullId);
  const plan = parsePlanData(data);

  if (isLoading || !plan) {
    return <span className="text-xs text-[var(--patronize-muted)]">...</span>;
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1 text-[var(--patronize-muted)]">
        <Users className="w-3 h-3" />
        {plan.subscriberCount} subscribers
      </span>
      <span className="flex items-center gap-1 text-[var(--patronize-success)]">
        <TrendingUp className="w-3 h-3" />
        {parseFloat(formatUnits(plan.totalRevenue, 18)).toFixed(2)} MNEE
      </span>
    </div>
  );
}

export default function PatronizeMyPage() {
  const { address, isConnected } = useAccount();
  const { plans, isLoading, refetch } = useMyPlans(address);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/apps/patronize/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Heart className="w-12 h-12 mx-auto mb-4 text-[var(--patronize-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--patronize-text)] mb-4">
          Dashboard
        </h1>
        <p className="text-[var(--patronize-muted)] mb-6">
          Connect your wallet to view your plans.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--patronize-muted)]" />
        <p className="mt-4 text-[var(--patronize-muted)]">Loading your plans...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--patronize-text)]">
          My Plans
        </h1>
        <Link
          href="/apps/patronize/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--patronize-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-16 bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded-xl">
          <Heart className="w-12 h-12 mx-auto mb-4 text-[var(--patronize-muted)]" />
          <p className="text-[var(--patronize-muted)] mb-4">
            You haven&apos;t created any subscription plans yet.
          </p>
          <Link
            href="/apps/patronize/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--patronize-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create Your First Plan
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--patronize-text)] mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-[var(--patronize-muted)] mb-3">
                    <span className="text-[var(--patronize-accent)] font-medium">
                      {plan.price} MNEE
                    </span>
                    {' '}/ {formatInterval(plan.intervalDays).toLowerCase()}
                    {plan.trialDays > 0 && (
                      <span className="ml-2 text-[var(--patronize-success)]">
                        ({plan.trialDays} day trial)
                      </span>
                    )}
                  </p>
                  <PlanStats planId={plan.id} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyLink(plan.id)}
                    className="p-2 hover:bg-[var(--patronize-bg)] rounded-lg transition-colors"
                    title="Copy link"
                  >
                    {copiedId === plan.id ? (
                      <Check className="w-4 h-4 text-[var(--patronize-success)]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--patronize-muted)]" />
                    )}
                  </button>
                  <Link
                    href={`/apps/patronize/${plan.id}`}
                    className="p-2 hover:bg-[var(--patronize-bg)] rounded-lg transition-colors"
                    title="View plan"
                  >
                    <ExternalLink className="w-4 h-4 text-[var(--patronize-muted)]" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
