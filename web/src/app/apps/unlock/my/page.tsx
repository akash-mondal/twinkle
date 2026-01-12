'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Copy, Check, Edit2, Trash2, ExternalLink, Plus, Loader2, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { useMyPastes, deletePaste, Paste } from '@/hooks/usePastes';
import { usePaywallStats } from '@/hooks/usePaywall';

// Component to show earnings for each paste
function PasteEarnings({ pasteId }: { pasteId: string }) {
  const { totalRevenue, totalUnlocks, isLoading } = usePaywallStats(pasteId);

  if (isLoading) {
    return <span className="text-xs text-[var(--unlock-muted)]">...</span>;
  }

  const earnedFormatted = formatUnits(totalRevenue, 18);

  return (
    <span className="inline-flex items-center gap-3 text-sm">
      <span className="inline-flex items-center gap-1 text-green-600">
        <TrendingUp className="w-3 h-3" />
        {parseFloat(earnedFormatted).toFixed(2)} MNEE earned
      </span>
      <span className="inline-flex items-center gap-1 text-[var(--unlock-muted)]">
        <Users className="w-3 h-3" />
        {totalUnlocks} unlocks
      </span>
    </span>
  );
}

export default function MyPastesPage() {
  const { address, isConnected } = useAccount();
  const { pastes, isLoading, refetch } = useMyPastes(address);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/apps/unlock/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!address) return;
    if (!confirm('Delete this paste? This cannot be undone.')) return;

    setDeletingId(id);
    try {
      await deletePaste(id, address);
      refetch();
    } catch (e) {
      console.error('Failed to delete:', e);
      alert('Failed to delete paste');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1
          className="text-2xl font-bold text-[var(--unlock-text)] mb-4"
          style={{ fontFamily: 'var(--font-unlock-heading)' }}
        >
          My Pastes
        </h1>
        <p className="text-[var(--unlock-muted)] mb-6">
          Connect your wallet to see your pastes.
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
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--unlock-muted)]" />
        <p className="mt-4 text-[var(--unlock-muted)]">Loading your pastes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-2xl font-bold text-[var(--unlock-text)]"
          style={{ fontFamily: 'var(--font-unlock-heading)' }}
        >
          My Pastes
        </h1>
        <Link
          href="/apps/unlock/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--unlock-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Paste
        </Link>
      </div>

      {pastes.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[var(--unlock-border)] rounded-lg">
          <p className="text-[var(--unlock-muted)] mb-4">You haven&apos;t created any pastes yet.</p>
          <Link
            href="/apps/unlock/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--unlock-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create Your First Paste
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pastes.map((paste, i) => (
            <motion.div
              key={paste.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-[var(--unlock-border)] rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-[var(--unlock-text)] truncate"
                    style={{ fontFamily: 'var(--font-unlock-heading)' }}
                  >
                    {paste.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-[var(--unlock-muted)] mt-1">
                    ID: {paste.id} • {paste.price} MNEE •{' '}
                    {new Date(paste.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2">
                    <PasteEarnings pasteId={paste.id} />
                  </div>
                  <p
                    className="text-sm text-[var(--unlock-muted)] mt-2 line-clamp-2"
                    style={{ fontFamily: 'var(--font-unlock-mono)' }}
                  >
                    {paste.content.slice(0, 100)}...
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyLink(paste.id)}
                    className="p-2 hover:bg-[var(--unlock-bg-dark)] rounded-lg transition-colors"
                    title="Copy link"
                  >
                    {copiedId === paste.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--unlock-muted)]" />
                    )}
                  </button>
                  <Link
                    href={`/apps/unlock/${paste.id}`}
                    className="p-2 hover:bg-[var(--unlock-bg-dark)] rounded-lg transition-colors"
                    title="View"
                  >
                    <ExternalLink className="w-4 h-4 text-[var(--unlock-muted)]" />
                  </Link>
                  <Link
                    href={`/apps/unlock/${paste.id}/edit`}
                    className="p-2 hover:bg-[var(--unlock-bg-dark)] rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-[var(--unlock-muted)]" />
                  </Link>
                  <button
                    onClick={() => handleDelete(paste.id)}
                    disabled={deletingId === paste.id}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === paste.id ? (
                      <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
