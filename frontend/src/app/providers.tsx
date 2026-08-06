'use client';

import React, { useEffect, useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { arbitrumSepolia } from 'viem/chains';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const privyAppId =
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cm76543210000000000000000';

  useEffect(() => {
    setMounted(true);
  }, []);

  // During static prerendering (SSR / SSG / npm run build), render children directly.
  // This prevents Privy from failing static page generation when APP_ID is not initialized.
  if (!mounted) {
    return <>{children}</>;
  }

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
