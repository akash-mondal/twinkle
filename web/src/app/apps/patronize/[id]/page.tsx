'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Heart, Loader2, Check, Calendar, Users, TrendingUp, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { keccak256, toHex, formatUnits } from 'viem';
import {
  usePlan,
  parsePlanData,
  useHasValidSubscription,
  useUserSubscription,
  useSubscription,
  parseSubscriptionData,
  useMNEEApprovalForSubscription,
  useMNEEAllowanceForSubscription,
  useSubscribeToPlan,
  useRenewSubscription,
  useCancelSubscription,
  useMNEEBalance,
  formatInterval,
} from '@/hooks/useSubscription';
import { usePlanData } from '@/hooks/usePlans';

type Step = 'idle' | 'approving' | 'subscribing' | 'renewing' | 'cancelling' | 'verifying';

export default function PatronizePlanPage() {
  const params = useParams();
  const shortId = params.id as string;
  const fullId = keccak256(toHex(shortId)) as `0x${string}`;

  const { address, isConnected } = useAccount();

  const [step, setStep] = useState<Step>('idle');

  // Refs to prevent double-handling
  const handledApprovalRef = useRef<string | null>(null);
  const handledSubscribeRef = useRef<string | null>(null);
  const handledRenewRef = useRef<string | null>(null);
  const handledCancelRef = useRef<string | null>(null);

  // Fetch plan data from server and chain
  const { plan: serverPlan, isLoading: isLoadingServer } = usePlanData(shortId);
  const { data: chainPlanData, isLoading: isLoadingChain, refetch: refetchPlan } = usePlan(fullId);
  const chainPlan = parsePlanData(chainPlanData);

  // Check subscription status
  const { data: hasValidSub, refetch: refetchValidSub } = useHasValidSubscription(fullId, address as `0x${string}`);
  const { data: subId, refetch: refetchSubId } = useUserSubscription(fullId, address as `0x${string}`);
  const { data: subData, refetch: refetchSub } = useSubscription(subId as `0x${string}`);
  const subscription = parseSubscriptionData(subData);

  // MNEE
  const { data: allowance, refetch: refetchAllowance } = useMNEEAllowanceForSubscription(address as `0x${string}`);
  const { data: balance } = useMNEEBalance(address as `0x${string}`);

  // Write hooks
  const { approve, isPending: isApproving, isConfirming: isConfirmingApproval, isSuccess: approvalSuccess, error: approvalError, hash: approvalHash, reset: resetApproval } = useMNEEApprovalForSubscription();
  const { subscribe, isPending: isSubscribing, isConfirming: isConfirmingSubscribe, isSuccess: subscribeSuccess, error: subscribeError, hash: subscribeHash, reset: resetSubscribe } = useSubscribeToPlan();
  const { renew, isPending: isRenewing, isConfirming: isConfirmingRenew, isSuccess: renewSuccess, error: renewError, hash: renewHash, reset: resetRenew } = useRenewSubscription();
  const { cancel, isPending: isCancelling, isConfirming: isConfirmingCancel, isSuccess: cancelSuccess, error: cancelError, hash: cancelHash, reset: resetCancel } = useCancelSubscription();

  // Combined price
  const price = chainPlan?.price ?? BigInt(0);
  const priceFormatted = formatUnits(price, 18);
  const allowanceBigInt = allowance as bigint | undefined;
  const balanceBigInt = balance as bigint | undefined;
  const needsApproval = allowanceBigInt !== undefined && allowanceBigInt !== null && price > BigInt(0) && allowanceBigInt < price;
  const hasBalance = balanceBigInt !== undefined && balanceBigInt !== null && balanceBigInt >= price;

  // Is creator?
  const isCreator = address && chainPlan?.creator?.toLowerCase() === address.toLowerCase();

  // Reset on errors
  useEffect(() => {
    if (approvalError) {
      setStep('idle');
      handledApprovalRef.current = null;
    }
  }, [approvalError]);

  useEffect(() => {
    if (subscribeError) {
      setStep('idle');
      handledSubscribeRef.current = null;
    }
  }, [subscribeError]);

  useEffect(() => {
    if (renewError) {
      setStep('idle');
      handledRenewRef.current = null;
    }
  }, [renewError]);

  useEffect(() => {
    if (cancelError) {
      setStep('idle');
      handledCancelRef.current = null;
    }
  }, [cancelError]);

  // Handle approval success -> subscribe
  useEffect(() => {
    if (approvalSuccess && approvalHash && step === 'approving' && handledApprovalRef.current !== approvalHash) {
      handledApprovalRef.current = approvalHash;
      refetchAllowance();
      setStep('subscribing');
      subscribe(fullId);
    }
  }, [approvalSuccess, approvalHash, step, fullId, subscribe, refetchAllowance]);

  // Handle subscribe success
  useEffect(() => {
    if (subscribeSuccess && subscribeHash && handledSubscribeRef.current !== subscribeHash) {
      handledSubscribeRef.current = subscribeHash;
      setStep('verifying');
      setTimeout(async () => {
        await refetchValidSub();
        await refetchSubId();
        await refetchPlan();
        setStep('idle');
        resetSubscribe();
      }, 2000);
    }
  }, [subscribeSuccess, subscribeHash, refetchValidSub, refetchSubId, refetchPlan, resetSubscribe]);

  // Handle renew success
  useEffect(() => {
    if (renewSuccess && renewHash && handledRenewRef.current !== renewHash) {
      handledRenewRef.current = renewHash;
      setStep('verifying');
      setTimeout(async () => {
        await refetchSub();
        await refetchPlan();
        setStep('idle');
        resetRenew();
      }, 2000);
    }
  }, [renewSuccess, renewHash, refetchSub, refetchPlan, resetRenew]);

  // Handle cancel success
  useEffect(() => {
    if (cancelSuccess && cancelHash && handledCancelRef.current !== cancelHash) {
      handledCancelRef.current = cancelHash;
      setStep('verifying');
      setTimeout(async () => {
        await refetchSub();
        setStep('idle');
        resetCancel();
      }, 2000);
    }
  }, [cancelSuccess, cancelHash, refetchSub, resetCancel]);

  // Subscribe handler
  const handleSubscribe = async () => {
    if (!isConnected) return;

    if (needsApproval) {
      setStep('approving');
      await approve(price);
    } else {
      setStep('subscribing');
      await subscribe(fullId);
    }
  };

  // Renew handler
  const handleRenew = async () => {
    if (!subId || subId === '0x0000000000000000000000000000000000000000000000000000000000000000') return;

    // Check approval for renewal
    if (needsApproval) {
      setStep('approving');
      await approve(price);
      // After approval, we need to renew instead of subscribe
      // This is handled separately
    } else {
      setStep('renewing');
      await renew(subId as `0x${string}`);
    }
  };

  // Cancel handler
  const handleCancel = async () => {
    if (!subId || subId === '0x0000000000000000000000000000000000000000000000000000000000000000') return;
    if (!confirm('Cancel your subscription? You will still have access until the current period ends.')) return;

    setStep('cancelling');
    await cancel(subId as `0x${string}`);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading
  if (isLoadingServer || isLoadingChain) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--patronize-muted)]" />
        <p className="mt-4 text-[var(--patronize-muted)]">Loading plan...</p>
      </div>
    );
  }

  // Not found
  if (!serverPlan || !chainPlan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[var(--patronize-muted)]" />
        <h2 className="text-2xl font-bold text-[var(--patronize-text)] mb-2">
          Plan Not Found
        </h2>
        <p className="text-[var(--patronize-muted)]">
          This plan doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  const anyError = approvalError || subscribeError || renewError || cancelError;
  const isProcessing = step !== 'idle';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Plan Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--patronize-accent)]/20 mb-4">
          <Heart className="w-8 h-8 text-[var(--patronize-accent)]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--patronize-text)] mb-2">
          {serverPlan.name}
        </h1>
        {serverPlan.description && (
          <p className="text-[var(--patronize-muted)] max-w-md mx-auto">
            {serverPlan.description}
          </p>
        )}
      </div>

      {/* Price Card */}
      <div className="bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded-xl p-6 mb-6">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold text-[var(--patronize-accent)]">{priceFormatted}</span>
          <span className="text-[var(--patronize-muted)] ml-2">
            MNEE / {formatInterval(chainPlan.intervalDays).toLowerCase()}
          </span>
          {chainPlan.trialDays > 0 && (
            <p className="text-sm text-[var(--patronize-success)] mt-2">
              {chainPlan.trialDays} day free trial
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-[var(--patronize-bg)] rounded-lg">
            <Users className="w-5 h-5 mx-auto mb-1 text-[var(--patronize-muted)]" />
            <p className="text-lg font-semibold text-[var(--patronize-text)]">{chainPlan.subscriberCount}</p>
            <p className="text-xs text-[var(--patronize-muted)]">Subscribers</p>
          </div>
          <div className="text-center p-3 bg-[var(--patronize-bg)] rounded-lg">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-[var(--patronize-muted)]" />
            <p className="text-lg font-semibold text-[var(--patronize-text)]">
              {parseFloat(formatUnits(chainPlan.totalRevenue, 18)).toFixed(2)}
            </p>
            <p className="text-xs text-[var(--patronize-muted)]">MNEE Earned</p>
          </div>
        </div>

        {/* Action Area */}
        {!isConnected ? (
          <div className="flex justify-center">
            <ConnectButton label="Connect to Subscribe" />
          </div>
        ) : isCreator ? (
          <div className="text-center p-4 bg-[var(--patronize-success)]/10 rounded-lg border border-[var(--patronize-success)]/30">
            <Check className="w-6 h-6 mx-auto mb-2 text-[var(--patronize-success)]" />
            <p className="text-[var(--patronize-success)] font-medium">This is your plan</p>
            <Link
              href="/apps/patronize/my"
              className="text-sm text-[var(--patronize-accent)] hover:underline mt-1 inline-block"
            >
              Manage in Dashboard
            </Link>
          </div>
        ) : hasValidSub ? (
          // Active subscription
          <div className="space-y-4">
            <div className="p-4 bg-[var(--patronize-success)]/10 rounded-lg border border-[var(--patronize-success)]/30">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-[var(--patronize-success)]" />
                <span className="font-medium text-[var(--patronize-success)]">
                  {subscription?.cancelled ? 'Subscription Ending' : 'Active Subscription'}
                </span>
              </div>
              {subscription && (
                <div className="flex items-center gap-2 text-sm text-[var(--patronize-muted)]">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {subscription.cancelled ? 'Ends' : 'Renews'} {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </div>
              )}
            </div>

            {subscription?.cancelled ? (
              <p className="text-sm text-center text-[var(--patronize-muted)]">
                Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRenew}
                  disabled={isProcessing}
                  className="py-3 bg-[var(--patronize-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(step === 'approving' || step === 'renewing' || step === 'verifying') && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {step === 'approving' ? 'Approving...' : step === 'renewing' ? 'Renewing...' : step === 'verifying' ? 'Verifying...' : 'Renew Now'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="py-3 border border-[var(--patronize-border)] text-[var(--patronize-text)] rounded-lg font-medium hover:bg-[var(--patronize-bg)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {step === 'cancelling' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {step === 'cancelling' ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        ) : !hasBalance ? (
          <div className="text-center">
            <p className="text-sm text-red-400 mb-2">Insufficient MNEE balance</p>
            <p className="text-xs text-[var(--patronize-muted)]">
              You need {priceFormatted} MNEE to subscribe.{' '}
              <a
                href="https://mnee.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--patronize-accent)]"
              >
                Get MNEE
              </a>
            </p>
          </div>
        ) : (
          // Subscribe button
          <button
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="w-full py-4 bg-[var(--patronize-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
            {step === 'approving'
              ? 'Approve in wallet...'
              : step === 'subscribing'
              ? 'Subscribing...'
              : step === 'verifying'
              ? 'Verifying...'
              : needsApproval
              ? `Approve & Subscribe for ${priceFormatted} MNEE`
              : `Subscribe for ${priceFormatted} MNEE`}
          </button>
        )}

        {/* Error */}
        {anyError && (
          <p className="mt-4 text-sm text-red-400 text-center">
            {anyError.message}
          </p>
        )}
      </div>

      {/* Creator info */}
      <p className="text-center text-sm text-[var(--patronize-muted)]">
        Created by {chainPlan.creator.slice(0, 6)}...{chainPlan.creator.slice(-4)}
      </p>
    </div>
  );
}
