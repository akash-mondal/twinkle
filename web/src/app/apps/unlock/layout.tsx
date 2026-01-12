'use client';

import { Playfair_Display, Fira_Code } from 'next/font/google';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { User, Unlock, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-unlock-heading',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-unlock-mono',
});

export default function UnlockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useAccount();

  return (
    <div
      className={`${playfair.variable} ${firaCode.variable} min-h-screen`}
      style={{
        '--unlock-bg': '#FDF6E3',
        '--unlock-bg-dark': '#EEE8D5',
        '--unlock-accent': '#C41200',
        '--unlock-text': '#1A1A1A',
        '--unlock-muted': '#657B83',
        '--unlock-border': '#E0D5C1',
      } as React.CSSProperties}
    >
      <div className="min-h-screen bg-[var(--unlock-bg)]">
        {/* Header */}
        <header className="border-b border-[var(--unlock-border)] bg-[var(--unlock-bg)]">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/apps"
                className="flex items-center gap-1 text-sm text-[var(--unlock-muted)] hover:text-[var(--unlock-text)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Apps
              </Link>
              <div className="w-px h-6 bg-[var(--unlock-border)]" />
              <Link href="/apps/unlock" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--unlock-accent)] flex items-center justify-center relative">
                  <Lock className="w-4 h-4 text-white" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--unlock-bg)] flex items-center justify-center">
                    <span className="text-[8px] font-bold text-[var(--unlock-accent)]">$</span>
                  </div>
                </div>
                <span
                  className="text-xl font-semibold text-[var(--unlock-text)]"
                  style={{ fontFamily: 'var(--font-unlock-heading)' }}
                >
                  Unlock
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {isConnected && (
                <>
                  <Link
                    href="/apps/unlock/unlocked"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--unlock-muted)] hover:text-[var(--unlock-text)] transition-colors"
                  >
                    <Unlock className="w-4 h-4" />
                    Unlocked
                  </Link>
                  <Link
                    href="/apps/unlock/my"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--unlock-muted)] hover:text-[var(--unlock-text)] transition-colors"
                  >
                    <User className="w-4 h-4" />
                    My Pastes
                  </Link>
                  <Link
                    href="/apps/unlock/new"
                    className="px-4 py-2 bg-[var(--unlock-accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    + New Paste
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

        {/* Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
