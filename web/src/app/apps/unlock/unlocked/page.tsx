'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ExternalLink, Loader2, Unlock } from 'lucide-react';
import Link from 'next/link';
import { useUserUnlocks } from '@/hooks/useUnlocks';

interface PasteWithUnlock {
  id: string;
  title: string;
  content: string;
  price: string;
  creator: string;
  createdAt: string;
  unlockedAt: string;
}

export default function UnlockedPastesPage() {
  const { address, isConnected } = useAccount();
  const { unlocks, isLoading: isLoadingUnlocks } = useUserUnlocks(address);
  const [pastes, setPastes] = useState<PasteWithUnlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch paste details for each unlock
  useEffect(() => {
    if (isLoadingUnlocks || !unlocks.length) {
      setIsLoading(false);
      return;
    }

    const fetchPastes = async () => {
      const pastePromises = unlocks.map(async (unlock) => {
        try {
          const res = await fetch(`/api/pastes?id=${unlock.pasteId}`);
          if (res.ok) {
            const paste = await res.json();
            return {
              ...paste,
              unlockedAt: unlock.unlockedAt,
            };
          }
        } catch (e) {
          console.error('Failed to fetch paste:', unlock.pasteId, e);
        }
        return null;
      });

      const results = await Promise.all(pastePromises);
      setPastes(results.filter(Boolean) as PasteWithUnlock[]);
      setIsLoading(false);
    };

    fetchPastes();
  }, [unlocks, isLoadingUnlocks]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1
          className="text-2xl font-bold text-[var(--unlock-text)] mb-4"
          style={{ fontFamily: 'var(--font-unlock-heading)' }}
        >
          Unlocked Pastes
        </h1>
        <p className="text-[var(--unlock-muted)] mb-6">
          Connect your wallet to see your unlocked pastes.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingUnlocks) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--unlock-muted)]" />
        <p className="mt-4 text-[var(--unlock-muted)]">Loading your unlocked pastes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Unlock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-[var(--unlock-text)]"
              style={{ fontFamily: 'var(--font-unlock-heading)' }}
            >
              Unlocked Pastes
            </h1>
            <p className="text-sm text-[var(--unlock-muted)]">
              Content you&apos;ve paid to access
            </p>
          </div>
        </div>
      </div>

      {pastes.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[var(--unlock-border)] rounded-lg">
          <Unlock className="w-12 h-12 mx-auto mb-4 text-[var(--unlock-muted)]" />
          <p className="text-[var(--unlock-muted)] mb-4">You haven&apos;t unlocked any pastes yet.</p>
          <Link
            href="/apps/unlock"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--unlock-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Browse Pastes
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
                    Unlocked {new Date(paste.unlockedAt).toLocaleDateString()} • {paste.price} MNEE
                  </p>
                  <p
                    className="text-sm text-[var(--unlock-muted)] mt-2 line-clamp-2"
                    style={{ fontFamily: 'var(--font-unlock-mono)' }}
                  >
                    {paste.content.slice(0, 100)}...
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/apps/unlock/${paste.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
