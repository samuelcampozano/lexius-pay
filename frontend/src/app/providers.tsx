'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { arbitrumSepolia } from 'viem/chains';
import { LanguageProvider } from '@/context/LanguageContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Uses valid 25-character CUID format fallback so Privy's internal format validator passes during SSR / docker builds
  const privyAppId =
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmsdomun500060dk3xvzqpgoy';

  return (
    <LanguageProvider>
      <PrivyProvider
        appId={privyAppId}
        config={{
          loginMethods: ['telegram', 'google', 'email', 'wallet'],
          appearance: {
            theme: 'dark',
            accentColor: '#00e5ff',
            logo: 'https://raw.githubusercontent.com/samuelcampozano/lexius-pay/main/frontend/public/lexius-logo.png',
            showWalletLoginFirst: false,
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
            requireUserPasswordOnCreate: false,
          },
          defaultChain: arbitrumSepolia,
          supportedChains: [arbitrumSepolia],
        }}
      >
        {children}
      </PrivyProvider>
    </LanguageProvider>
  );
}
