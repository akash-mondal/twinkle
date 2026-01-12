'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Check, Loader2, Copy, Heart } from 'lucide-react';
import Link from 'next/link';
import { generatePlanId, useCreatePlan } from '@/hooks/useSubscription';
import { createPlan } from '@/hooks/usePlans';

const INTERVALS = [
  { value: 1, label: 'Daily' },
  { value: 7, label: 'Weekly' },
  { value: 30, label: 'Monthly' },
  { value: 365, label: 'Yearly' },
];

export default function PatronizeNewPage() {
  const { address, isConnected } = useAccount();
  const { createPlan: createOnChain, isPending, isConfirming, isSuccess, error, hash } = useCreatePlan();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('5');
  const [intervalDays, setIntervalDays] = useState(30);
  const [trialDays, setTrialDays] = useState(0);
  const [shortId, setShortId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Ref to prevent double-handling
  const handledHashRef = useRef<string | null>(null);

  // Handle success
  useEffect(() => {
    if (isSuccess && hash && shortId && handledHashRef.current !== hash) {
      handledHashRef.current = hash;
      setShowSuccess(true);
    }
  }, [isSuccess, hash, shortId]);

  // Reset on error
  useEffect(() => {
    if (error) {
      setSaveError(error.message || 'Transaction failed');
      handledHashRef.current = null;
    }
  }, [error]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setSaveError('Please enter a plan name');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setSaveError('Please set a valid price');
      return;
    }
    if (!address) {
      setSaveError('Please connect your wallet');
      return;
    }

    setSaveError(null);
    const { shortId: newShortId, fullId } = generatePlanId();
    setShortId(newShortId);

    try {
      // Save metadata to server first
      await createPlan({
        id: newShortId,
        name: name.trim(),
        description: description.trim(),
        price,
        intervalDays,
        trialDays,
        creator: address,
      });

      // Create on-chain
      await createOnChain(fullId, price, intervalDays, trialDays);
    } catch (e: any) {
      if (e.message?.includes('User rejected') || e.message?.includes('denied')) {
        setSaveError('Transaction cancelled');
      } else {
        setSaveError(e.message || 'Failed to create plan');
      }
      setShortId('');
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/apps/patronize/${shortId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const link = shortId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/apps/patronize/${shortId}` : '';

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Heart className="w-12 h-12 mx-auto mb-4 text-[var(--patronize-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--patronize-text)] mb-4">
          Create a Subscription Plan
        </h1>
        <p className="text-[var(--patronize-muted)] mb-6">
          Connect your wallet to create a subscription plan.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--patronize-success)]/20 flex items-center justify-center">
          <Check className="w-10 h-10 text-[var(--patronize-success)]" />
        </div>
        <h2 className="text-3xl font-bold text-[var(--patronize-text)] mb-2">
          Plan Created!
        </h2>
        <p className="text-[var(--patronize-muted)] mb-8">
          Share this link to start getting subscribers
        </p>

        <div className="max-w-md mx-auto bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm text-[var(--patronize-text)] truncate">
              {link}
            </code>
            <button
              onClick={copyLink}
              className="p-2 hover:bg-[var(--patronize-bg)] rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-[var(--patronize-success)]" />
              ) : (
                <Copy className="w-5 h-5 text-[var(--patronize-muted)]" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href={`/apps/patronize/${shortId}`}
            className="px-6 py-3 bg-[var(--patronize-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            View Plan
          </Link>
          <Link
            href="/apps/patronize/new"
            onClick={() => {
              setShowSuccess(false);
              setName('');
              setDescription('');
              setPrice('5');
              setIntervalDays(30);
              setTrialDays(0);
              setShortId('');
              handledHashRef.current = null;
            }}
            className="px-6 py-3 border border-[var(--patronize-border)] text-[var(--patronize-text)] rounded-lg font-medium hover:bg-[var(--patronize-bg-light)] transition-colors"
          >
            Create Another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--patronize-text)] mb-8">
        Create Subscription Plan
      </h1>

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--patronize-text)] mb-2">
            Plan Name *
          </label>
          <input
            type="text"
            placeholder="e.g., Premium Membership"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded-lg text-[var(--patronize-text)] placeholder:text-[var(--patronize-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--patronize-accent)]/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[var(--patronize-text)] mb-2">
            Description
          </label>
          <textarea
            placeholder="What do subscribers get?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded-lg text-[var(--patronize-text)] placeholder:text-[var(--patronize-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--patronize-accent)]/50 resize-none"
          />
        </div>

        {/* Price and Interval */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--patronize-text)] mb-2">
              Price (MNEE) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded-lg text-[var(--patronize-text)] focus:outline-none focus:ring-2 focus:ring-[var(--patronize-accent)]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--patronize-text)] mb-2">
              Billing Cycle *
            </label>
            <select
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="w-full px-4 py-3 bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded-lg text-[var(--patronize-text)] focus:outline-none focus:ring-2 focus:ring-[var(--patronize-accent)]/50"
            >
              {INTERVALS.map((interval) => (
                <option key={interval.value} value={interval.value}>
                  {interval.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trial Days */}
        <div>
          <label className="block text-sm font-medium text-[var(--patronize-text)] mb-2">
            Free Trial (days)
          </label>
          <input
            type="number"
            min="0"
            max="30"
            value={trialDays}
            onChange={(e) => setTrialDays(Number(e.target.value))}
            className="w-full px-4 py-3 bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded-lg text-[var(--patronize-text)] focus:outline-none focus:ring-2 focus:ring-[var(--patronize-accent)]/50"
          />
          <p className="mt-1 text-xs text-[var(--patronize-muted)]">
            Set to 0 for no trial. New subscribers won&apos;t be charged during the trial period.
          </p>
        </div>

        {/* Preview */}
        <div className="p-4 bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded-lg">
          <p className="text-sm text-[var(--patronize-muted)] mb-2">Preview</p>
          <p className="text-[var(--patronize-text)]">
            <span className="text-2xl font-bold text-[var(--patronize-accent)]">{price || '0'}</span>
            <span className="text-[var(--patronize-muted)]">
              {' '}MNEE / {INTERVALS.find(i => i.value === intervalDays)?.label.toLowerCase() || 'month'}
            </span>
          </p>
          {trialDays > 0 && (
            <p className="text-sm text-[var(--patronize-success)] mt-1">
              + {trialDays} day free trial
            </p>
          )}
        </div>

        {/* Error */}
        {saveError && (
          <p className="text-sm text-red-400">{saveError}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || isPending || isConfirming}
          className="w-full py-4 bg-[var(--patronize-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {(isPending || isConfirming) && <Loader2 className="w-5 h-5 animate-spin" />}
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Creating...' : 'Create Plan'}
        </button>
      </div>
    </div>
  );
}
