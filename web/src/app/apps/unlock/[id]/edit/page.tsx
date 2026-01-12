'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePaste, updatePaste } from '@/hooks/usePastes';

export default function EditPastePage() {
  const params = useParams();
  const router = useRouter();
  const shortId = params.id as string;

  const { address, isConnected } = useAccount();

  const { paste, isLoading: isLoadingPaste } = usePaste(shortId);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load paste data
  useEffect(() => {
    if (paste) {
      setContent(paste.content);
      setTitle(paste.title);
    }
  }, [paste]);

  // Check ownership
  const isOwner = address && paste?.creator?.toLowerCase() === address.toLowerCase();

  const handleSave = async () => {
    if (!paste || !address) return;

    setSaving(true);
    setError(null);

    try {
      await updatePaste(shortId, address, { content, title });
      router.push(`/apps/unlock/${shortId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
      setSaving(false);
    }
  };

  // Character count
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-[var(--unlock-muted)] mb-4">Connect wallet to edit.</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoadingPaste) {
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
        <h2 className="text-2xl font-bold text-[var(--unlock-text)] mb-2">Not Found</h2>
        <p className="text-[var(--unlock-muted)]">This paste doesn&apos;t exist.</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-[var(--unlock-text)] mb-2">Access Denied</h2>
        <p className="text-[var(--unlock-muted)]">You don&apos;t own this paste.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/apps/unlock/${shortId}`}
          className="flex items-center gap-2 text-[var(--unlock-muted)] hover:text-[var(--unlock-text)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1
          className="text-xl font-bold text-[var(--unlock-text)]"
          style={{ fontFamily: 'var(--font-unlock-heading)' }}
        >
          Edit Paste
        </h1>
        <div className="w-16" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Title */}
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 mb-4 bg-white border border-[var(--unlock-border)] rounded-lg text-[var(--unlock-text)] placeholder:text-[var(--unlock-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--unlock-accent)]/30"
          style={{ fontFamily: 'var(--font-unlock-heading)' }}
        />

        {/* Editor */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[400px] px-4 py-4 bg-white border border-[var(--unlock-border)] rounded-lg text-[var(--unlock-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unlock-accent)]/30 resize-none"
            style={{ fontFamily: 'var(--font-unlock-mono)', fontSize: '14px', lineHeight: '1.6' }}
          />

          {/* Stats bar */}
          <div className="absolute bottom-3 right-3 flex items-center gap-4 text-xs text-[var(--unlock-muted)]">
            <span>{charCount} chars</span>
            <span>{wordCount} words</span>
          </div>
        </div>

        {/* Note about price */}
        <p className="mt-4 text-sm text-[var(--unlock-muted)]">
          Price cannot be changed after creation (blockchain limitation).
          Current price: <span className="font-medium text-[#E78B1F]">{paste.price} MNEE</span>
        </p>

        {error && (
          <p className="mt-4 text-sm text-red-500">{error}</p>
        )}

        {/* Save button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="px-6 py-3 bg-[var(--unlock-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
