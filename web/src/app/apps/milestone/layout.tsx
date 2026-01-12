'use client';

import { Space_Grotesk } from 'next/font/google';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';
import { User, Milestone as MilestoneIcon, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export default function MilestoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useAccount();
  const pathname = usePathname();

  // Hide header on main landing page
  const isLandingPage = pathname === '/apps/milestone';

  return (
    <div
      className={`${spaceGrotesk.className} min-h-screen`}
      style={{
        '--milestone-bg': '#FFFFFF',
        '--milestone-bg-alt': '#F9FAFB',
        '--milestone-accent': '#CAFF00',
        '--milestone-accent-dark': '#a3cc00',
        '--milestone-text': '#0D1117',
        '--milestone-muted': '#6B7280',
        '--milestone-border': '#E5E7EB',
        '--milestone-success': '#22C55E',
      } as React.CSSProperties}
    >
      <div className="min-h-screen bg-[var(--milestone-bg)]">
        {/* Header - hidden on landing page */}
        {!isLandingPage && (
          <header className="border-b border-[var(--milestone-border)] bg-white">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/apps"
                  className="flex items-center gap-1 text-sm text-[var(--milestone-muted)] hover:text-[var(--milestone-text)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Apps
                </Link>
                <div className="w-px h-6 bg-[var(--milestone-border)]" />
                <Link href="/apps/milestone" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--milestone-text)] flex items-center justify-center">
                    <MilestoneIcon className="w-4 h-4 text-[var(--milestone-accent)]" />
                  </div>
                  <span className="text-xl font-semibold text-[var(--milestone-text)]">
                    Milestone
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {isConnected && (
                  <>
                    <Link
                      href="/apps/milestone/my"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--milestone-muted)] hover:text-[var(--milestone-text)] transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Projects
                    </Link>
                    <Link
                      href="/apps/milestone/new"
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--milestone-text)] text-[var(--milestone-accent)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-4 h-4" />
                      New Project
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
