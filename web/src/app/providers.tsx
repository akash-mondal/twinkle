'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useState, useEffect } from 'react';

// RainbowKit config - Ethereum Mainnet
const config = getDefaultConfig({
  appName: 'Twinkle',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'twinkle-demo',
  chains: [mainnet],
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <div className="animate-pulse" />
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#A855F7',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
