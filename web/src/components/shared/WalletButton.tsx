'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';

export function WalletButton() {
  const { login, logout, authenticated, user } = usePrivy();
  const { address, isConnected } = useAccount();

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : user?.email?.address || 'Connected';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{displayAddress}</span>
      <button
        onClick={logout}
        className="px-3 py-1.5 bg-surface hover:bg-surface-elevated text-foreground rounded-lg text-sm transition-colors border border-border"
      >
        Disconnect
      </button>
    </div>
  );
}
