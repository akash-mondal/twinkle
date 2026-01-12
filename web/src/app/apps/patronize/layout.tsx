'use client';

import { DM_Sans } from 'next/font/google';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';
import { User, Heart, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-patronize',
});

export default function PatronizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useAccount();
  const pathname = usePathname();

  // Hide header on main landing page
  const isLandingPage = pathname === '/apps/patronize';

  return (
    <div
      className={`${dmSans.className} min-h-screen`}
      style={{
        '--patronize-bg': '#1A1A2E',
        '--patronize-bg-light': '#25253D',
        '--patronize-accent': '#7C3AED',
        '--patronize-accent-light': '#A78BFA',
        '--patronize-text': '#FFFFFF',
        '--patronize-muted': '#9CA3AF',
        '--patronize-border': '#374151',
        '--patronize-success': '#10B981',
      } as React.CSSProperties}
    >
      <div className="min-h-screen bg-[var(--patronize-bg)]">
        {/* Header - hidden on landing page */}
        {!isLandingPage && (
          <header className="border-b border-[var(--patronize-border)] bg-[var(--patronize-bg)]">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/apps"
                  className="flex items-center gap-1 text-sm text-[var(--patronize-muted)] hover:text-[var(--patronize-text)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Apps
                </Link>
                <div className="w-px h-6 bg-[var(--patronize-border)]" />
                <Link href="/apps/patronize" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--patronize-accent)] flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-[var(--patronize-text)]">
                    Patronize
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {isConnected && (
                  <>
                    <Link
                      href="/apps/patronize/my"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--patronize-muted)] hover:text-[var(--patronize-text)] transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/apps/patronize/new"
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--patronize-accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-4 h-4" />
                      Create Plan
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
