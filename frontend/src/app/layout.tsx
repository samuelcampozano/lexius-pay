'use client';

import React, { useEffect } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Providers from './providers';
import WelcomeGiftModal from '@/components/WelcomeGiftModal';
import TmaActionProvider from '@/components/TmaActionProvider';
import Footer from '@/components/Footer';
import { initTelegramWebApp } from '@/lib/telegram';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initTelegramWebApp();
  }, []);

  return (
    <html lang="es" className="dark">
      <head>
        <title>Lexius — Autonomous AI P2P Escrow on Arbitrum Stylus</title>
        <meta
          name="description"
          content="Decentralized P2P escrow links with autonomous AI dispute resolution on Arbitrum Stylus."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" href="/lexius-logo.png" type="image/png" />
        <link rel="shortcut icon" href="/lexius-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/lexius-logo.png" />
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className="min-h-screen bg-[#040814] text-slate-100 antialiased flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Ambient Top Light Beam */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-cyan-500/15 via-blue-600/5 to-transparent blur-3xl opacity-70 -z-10" />

        <Providers>
          <TmaActionProvider />
          <WelcomeGiftModal />
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
