'use client';

import { Inter } from 'next/font/google';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';
import { User, PieChart, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export default function SoundSplitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useAccount();
  const pathname = usePathname();

  // Hide header on main landing page
  const isLandingPage = pathname === '/apps/soundsplit';

  return (
    <div
      className={`${inter.className} min-h-screen`}
      style={{
        '--split-bg': '#FAFAFA',
        '--split-bg-dark': '#F3F4F6',
        '--split-accent': '#6366F1',
        '--split-accent-light': '#818CF8',
        '--split-text': '#111827',
        '--split-muted': '#6B7280',
        '--split-border': '#E5E7EB',
        '--split-success': '#10B981',
      } as React.CSSProperties}
    >
      <div className="min-h-screen bg-[var(--split-bg)]">
        {/* Header - hidden on landing page */}
        {!isLandingPage && (
          <header className="border-b border-[var(--split-border)] bg-white">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/apps"
                  className="flex items-center gap-1 text-sm text-[var(--split-muted)] hover:text-[var(--split-text)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Apps
                </Link>
                <div className="w-px h-6 bg-[var(--split-border)]" />
                <Link href="/apps/soundsplit" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--split-accent)] flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-[var(--split-text)]">
                    SoundSplit
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {isConnected && (
                  <>
                    <Link
                      href="/apps/soundsplit/my"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--split-muted)] hover:text-[var(--split-text)] transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Splits
                    </Link>
                    <Link
                      href="/apps/soundsplit/new"
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--split-accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-4 h-4" />
                      Create Split
                    </Link>
                  </>
                )}
                <ConnectButton
                  accountStatus="address"
                  chainStatus="icon"
                  showBalance={false}
                />
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
