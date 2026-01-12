'use client';

import { JetBrains_Mono, Inter } from 'next/font/google';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-agent-body',
});

export default function AgentPayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${jetbrainsMono.className} ${inter.variable}`}
      style={{
        '--agent-bg': '#0B1120',
        '--agent-surface': '#131C2E',
        '--agent-surface-light': '#1A2332',
        '--agent-border': '#2A3441',
        '--agent-text': '#FFFFFF',
        '--agent-muted': '#64748B',
        '--agent-accent': '#10B981',
        '--agent-accent-orange': '#F59E0B',
        '--agent-accent-blue': '#3B82F6',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
