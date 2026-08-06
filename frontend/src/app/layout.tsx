'use client';

import React, { useEffect } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Providers from './providers';
import WelcomeGiftModal from '@/components/WelcomeGiftModal';
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
    <html lang="en">
      <head>
        <title>Lexius Pay — Autonomous AI P2P Escrow on Arbitrum Stylus</title>
        <meta
          name="description"
          content="Decentralized P2P escrow links with autonomous AI dispute resolution on Arbitrum Stylus."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className="min-h-screen bg-[#050811] text-slate-100 antialiased flex flex-col">
        <Providers>
          <WelcomeGiftModal />
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
            <p>
              Lexius Pay &copy; 2026 — Built on Arbitrum Stylus & Google Cloud Platform
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
