'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Lock, Unlock, Copy, Check, Loader2, Edit2, Code, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { keccak256, toHex, formatUnits } from 'viem';
import dynamic from 'next/dynamic';
import {
  usePaywall,
  useIsUnlocked,
  useMNEEAllowance,
  useMNEEApproval,
  usePayPaywall,
  useMNEEBalance,
} from '@/hooks/usePaywall';
import { usePaste } from '@/hooks/usePastes';
import { recordUnlock, useHasUnlocked } from '@/hooks/useUnlocks';

// Dynamically import CodeMirror for syntax highlighting
const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror').then((mod) => mod.default),
  { ssr: false }
);

// Load GitHub light theme for proper text colors
const loadEditorTheme = async () => {
  const { githubLight } = await import('@uiw/codemirror-theme-github');
  return githubLight;
};

// Markdown renderer
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

// Language extensions
const loadLanguage = async (lang: string) => {
  switch (lang) {
    case 'javascript':
    case 'typescript':
      const js = await import('@codemirror/lang-javascript');
      return lang === 'typescript' ? js.javascript({ typescript: true }) : js.javascript();
    case 'python':
      const py = await import('@codemirror/lang-python');
      return py.python();
    case 'html':
      const html = await import('@codemirror/lang-html');
      return html.html();
    case 'css':
      const css = await import('@codemirror/lang-css');
      return css.css();
    case 'json':
      const json = await import('@codemirror/lang-json');
      return json.json();
    case 'markdown':
      const md = await import('@codemirror/lang-markdown');
      return md.markdown();
    default:
      return null;
  }
};

const CONTENT_TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  plain: { label: 'Plain Text', icon: FileText },
  javascript: { label: 'JavaScript', icon: Code },
  typescript: { label: 'TypeScript', icon: Code },
  python: { label: 'Python', icon: Code },
  html: { label: 'HTML', icon: Code },
  css: { label: 'CSS', icon: Code },
  json: { label: 'JSON', icon: Code },
  markdown: { label: 'Markdown', icon: FileText },
};

export default function UnlockViewPage() {
  const params = useParams();
  const shortId = params.id as string;
  const fullId = keccak256(toHex(shortId)) as `0x${string}`;

  const { address, isConnected } = useAccount();

  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'idle' | 'approving' | 'paying' | 'verifying'>('idle');
  const [languageExt, setLanguageExt] = useState<any>(null);
  const [editorTheme, setEditorTheme] = useState<any>(null);

  // Load editor theme
  useEffect(() => {
    loadEditorTheme().then(setEditorTheme);
  }, []);

  // Track if we've already handled a success to prevent re-triggering
  const handledApprovalRef = useRef<string | null>(null);
  const handledPaymentRef = useRef<string | null>(null);

  // Fetch paste from server
  const { paste, isLoading: isLoadingPaste } = usePaste(shortId);

  // Load language extension based on content type
  useEffect(() => {
    if (paste?.contentType && paste.contentType !== 'plain') {
      loadLanguage(paste.contentType).then(setLanguageExt);
    }
  }, [paste?.contentType]);

  // Contract reads
  const { data: paywallData, isLoading: isLoadingPaywall } = usePaywall(fullId);
  const { data: isUnlockedOnChain, refetch: refetchUnlocked } = useIsUnlocked(fullId, address as `0x${string}`);
  const { data: allowance, refetch: refetchAllowance } = useMNEEAllowance(address as `0x${string}`);
  const { data: balance } = useMNEEBalance(address as `0x${string}`);

  // Local unlock check (fallback/backup)
  const { hasUnlocked: hasUnlockedLocally } = useHasUnlocked(address, shortId);

  // Combined unlock status - unlocked if either on-chain or local record says so
  const isUnlocked = isUnlockedOnChain || hasUnlockedLocally;

  // Contract writes
  const { approve, isPending: isApproving, isConfirming: isConfirmingApproval, isSuccess: approvalSuccess, error: approvalError, hash: approvalHash } = useMNEEApproval();
  const { pay, isPending: isPaying, isConfirming: isConfirmingPayment, isSuccess: paymentSuccess, error: payError, hash: paymentHash, reset: resetPayment } = usePayPaywall();

  // Reset state if transaction is rejected
  useEffect(() => {
    if (approvalError) {
      setStep('idle');
      handledApprovalRef.current = null;
    }
  }, [approvalError]);

  useEffect(() => {
    if (payError) {
      setStep('idle');
      handledPaymentRef.current = null;
    }
  }, [payError]);

  // Handle approval success - only once per hash
  useEffect(() => {
    if (approvalSuccess && approvalHash && step === 'approving' && handledApprovalRef.current !== approvalHash) {
      handledApprovalRef.current = approvalHash;
      refetchAllowance();
      setStep('paying');
      pay(fullId);
    }
  }, [approvalSuccess, approvalHash, step, fullId, pay, refetchAllowance]);

  // Handle payment success - only once per hash
  useEffect(() => {
    if (paymentSuccess && paymentHash && handledPaymentRef.current !== paymentHash && address) {
      handledPaymentRef.current = paymentHash;
      setStep('verifying');

      // Wait a bit for blockchain state to propagate, then refetch
      const verifyUnlock = async () => {
        // Small delay to ensure blockchain state is updated
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Record the unlock in our database for dashboard access
        try {
          await recordUnlock(shortId, address);
        } catch (e) {
          console.error('Failed to record unlock:', e);
        }

        await refetchUnlocked();
        setStep('idle');
        // Reset the payment state so it doesn't persist
        resetPayment();
      };

      verifyUnlock();
    }
  }, [paymentSuccess, paymentHash, refetchUnlocked, resetPayment, shortId, address]);

  // Parse paywall data
  const price = paywallData ? (paywallData as any)[1] : BigInt(0);
  const totalUnlocks = paywallData ? Number((paywallData as any)[3]) : 0;
  const totalRevenue = paywallData ? (paywallData as any)[4] : BigInt(0);

  const priceFormatted = formatUnits(price, 18);
  const revenueFormatted = formatUnits(totalRevenue, 18);
  const needsApproval = allowance !== undefined && allowance !== null && allowance < price;
  const hasBalance = balance !== undefined && balance !== null && balance >= price;

  // Check if current user is the creator (they get free access)
  const isCreator = address && paste?.creator?.toLowerCase() === address.toLowerCase();
  const hasAccess = isUnlocked || isCreator;

  // Handle unlock
  const handleUnlock = async () => {
    if (!isConnected) return;

    if (needsApproval) {
      setStep('approving');
      await approve(price);
    } else {
      setStep('paying');
      await pay(fullId);
    }
  };

  // Copy content
  const copyContent = () => {
    if (paste?.content) {
      navigator.clipboard.writeText(paste.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get content type info
  const contentTypeInfo = CONTENT_TYPE_LABELS[paste?.contentType || 'plain'] || CONTENT_TYPE_LABELS.plain;
  const ContentTypeIcon = contentTypeInfo.icon;

  // Blur effect for locked content
  const BlurredContent = ({ content }: { content: string }) => {
    const preview = content.slice(0, Math.floor(content.length * 0.2));
    return (
      <div className="relative">
        <pre
          className="whitespace-pre-wrap text-[var(--unlock-text)] blur-sm select-none"
          style={{ fontFamily: 'var(--font-unlock-mono)', fontSize: '14px', lineHeight: '1.6' }}
        >
          {preview}
          {'\n\n... content continues ...'}
        </pre>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--unlock-bg)]/50 to-[var(--unlock-bg)]" />
      </div>
    );
  };

  // Render unlocked content with syntax highlighting
  const UnlockedContent = ({ content, contentType }: { content: string; contentType: string }) => {
    if (contentType === 'markdown') {
      return (
        <div className="prose prose-sm max-w-none p-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    if (contentType === 'plain') {
      return (
        <pre
          className="whitespace-pre-wrap text-[var(--unlock-text)] p-4"
          style={{ fontFamily: 'var(--font-unlock-mono)', fontSize: '14px', lineHeight: '1.6' }}
        >
          {content}
        </pre>
      );
    }

    // Code with syntax highlighting
    return (
      <CodeMirror
        value={content}
        extensions={languageExt ? [languageExt] : []}
        editable={false}
        theme={editorTheme || 'light'}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: false,
          foldGutter: true,
          highlightActiveLine: false,
        }}
        className="text-sm [&_.cm-content]:text-[#1a1a1a] [&_.cm-line]:text-[#1a1a1a]"
      />
    );
  };

  if (isLoadingPaste || isLoadingPaywall) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--unlock-muted)]" />
        <p className="mt-4 text-[var(--unlock-muted)]">Loading...</p>
      </div>
    );
  }

  if (!paste) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2
          className="text-2xl font-bold text-[var(--unlock-text)] mb-2"
          style={{ fontFamily: 'var(--font-unlock-heading)' }}
        >
          Paste Not Found
        </h2>
        <p className="text-[var(--unlock-muted)]">
          This paste doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-[var(--unlock-text)] mb-2"
          style={{ fontFamily: 'var(--font-unlock-heading)' }}
        >
          {paste.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-[var(--unlock-muted)]">
          <span className="flex items-center gap-1">
            <ContentTypeIcon className="w-4 h-4" />
            {contentTypeInfo.label}
          </span>
          <span>-</span>
          <span>ID: {shortId}</span>
          <span>-</span>
          <span>{totalUnlocks} unlocks</span>
          <span>-</span>
          <span>{priceFormatted} MNEE</span>
          {isCreator && (
            <>
              <span>-</span>
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                {parseFloat(revenueFormatted).toFixed(2)} MNEE earned
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white border border-[var(--unlock-border)] rounded-lg overflow-hidden">
        {hasAccess ? (
          <>
            {/* Unlocked header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--unlock-border)] bg-green-50">
              <div className="flex items-center gap-2 text-green-700">
                <Unlock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isCreator ? 'Your Content' : 'Unlocked'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {isCreator && (
                  <Link
                    href={`/apps/unlock/${shortId}/edit`}
                    className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Link>
                )}
                <button
                  onClick={copyContent}
                  className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Full content with syntax highlighting */}
            <div className="overflow-auto max-h-[600px]">
              <UnlockedContent content={paste.content} contentType={paste.contentType || 'plain'} />
            </div>
          </>
        ) : (
          <>
            {/* Locked header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--unlock-border)] bg-[var(--unlock-bg-dark)]">
              <div className="flex items-center gap-2 text-[var(--unlock-muted)]">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Locked Content</span>
              </div>
            </div>

            {/* Blurred preview */}
            <div className="p-4">
              <BlurredContent content={paste.content} />
            </div>

            {/* Unlock CTA */}
            <div className="p-6 border-t border-[var(--unlock-border)] bg-[var(--unlock-bg)] text-center">
              <p className="text-[var(--unlock-muted)] mb-4">
                Pay <span className="font-semibold text-[#E78B1F]">{priceFormatted} MNEE</span> to unlock this content
              </p>

              {!isConnected ? (
                <div className="flex justify-center">
                  <ConnectButton label="Connect Wallet to Unlock" />
                </div>
              ) : !hasBalance ? (
                <div className="text-center">
                  <p className="text-sm text-red-500 mb-2">Insufficient MNEE balance</p>
                  <p className="text-xs text-[var(--unlock-muted)]">
                    You need {priceFormatted} MNEE.{' '}
                    <a
                      href="https://mnee.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[var(--unlock-accent)]"
                    >
                      Get MNEE here
                    </a>
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleUnlock}
                  disabled={isApproving || isConfirmingApproval || isPaying || isConfirmingPayment || step === 'verifying'}
                  className="px-8 py-3 bg-[var(--unlock-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {(isApproving || isConfirmingApproval || isPaying || isConfirmingPayment || step === 'verifying') && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {isApproving
                    ? 'Approve in wallet...'
                    : isConfirmingApproval
                    ? 'Approving...'
                    : isPaying
                    ? 'Confirm in wallet...'
                    : isConfirmingPayment
                    ? 'Unlocking...'
                    : step === 'verifying'
                    ? 'Verifying unlock...'
                    : needsApproval
                    ? `Approve & Unlock for ${priceFormatted} MNEE`
                    : `Unlock for ${priceFormatted} MNEE`}
                </button>
              )}

              {(payError || approvalError) && (
                <p className="mt-4 text-sm text-red-500">
                  {payError?.message || approvalError?.message}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
