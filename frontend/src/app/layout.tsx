'use client';

import React, { useEffect } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import { PrivyProvider } from '@privy-io/react-auth';
import { arbitrumSepolia } from 'viem/chains';
import { initTelegramWebApp } from '@/lib/telegram';
import { LanguageProvider } from '@/context/LanguageContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cm00000000000000000000000';

  useEffect(() => {
    initTelegramWebApp();
  }, []);
  const isValidPrivyAppId = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID && !process.env.NEXT_PUBLIC_PRIVY_APP_ID.includes('0000'));

  return (
    <html lang="es">
      <head>
        <title>Lexius Pay — Escrow P2P Autónomo con IA en Arbitrum Stylus</title>
        <meta
          name="description"
          content="Enlaces de escrow P2P descentralizados con resolución autónoma de disputas por IA en Arbitrum Stylus."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>

      <body className="min-h-screen bg-[#050811] text-slate-100 antialiased flex flex-col">
        <LanguageProvider>
          {isValidPrivyAppId ? (
            <PrivyProvider
            appId={privyAppId}
            config={{
              loginMethods: ['email', 'google', 'telegram', 'wallet'],
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
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
              <p>Lexius Pay &copy; 2026 — Desarrollado en Arbitrum Stylus & Google Cloud Platform</p>
            </footer>
          </PrivyProvider>
        ) : (
          <>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
              <p>Lexius Pay &copy; 2026 — Desarrollado en Arbitrum Stylus & Google Cloud Platform</p>
            </footer>
          </>
        )}
        </LanguageProvider>
              <p>Lexius Pay &copy; 2026 — Built on Arbitrum Stylus & Google Cloud Platform</p>
            </footer>
          </PrivyProvider>
        ) : (
          <>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
              <p>Lexius Pay &copy; 2026 — Built on Arbitrum Stylus & Google Cloud Platform</p>
            </footer>
          </>
        )}
>>>>>>> Stashed changes
      </body>
    </html>
  );
}
