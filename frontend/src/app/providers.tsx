'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { arbitrumSepolia } from 'viem/chains';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Uses valid 25-character CUID format fallback so Privy's internal format validator passes during SSR / docker builds
  const privyAppId =
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cm76543210000000000000000';

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['google', 'email', 'telegram', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#3b82f6',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: arbitrumSepolia,
        supportedChains: [arbitrumSepolia],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
