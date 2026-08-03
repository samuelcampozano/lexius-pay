'use client';

import React from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { LogOut, ShieldCheck } from 'lucide-react';

export default function WalletLogin() {
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];

  if (!authenticated) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => login({ loginMethod: 'passkey' } as any)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md"
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="text-sm">Sign in with Passkey</span>
        </button>

        <button
          onClick={() => login({ loginMethod: 'google' } as any)}
          className="flex items-center gap-2 px-3 py-2 bg-white text-slate-900 rounded-xl shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.4 1.2 8.6 3.1l6.4-6.4C35 2.7 29.9 0.5 24 0.5 14.8 0.5 6.9 5.7 2.8 13.6l7.4 5.7C12.8 14 17.9 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.5 24c0-1.6-.1-3.1-.4-4.6H24v8.7h12.9c-.6 3.4-2.6 6.1-5.5 8l8.4 6.5C43.8 38.5 46.5 31.8 46.5 24z"/>
            <path fill="#4A90E2" d="M10.2 28.8C9.1 26.9 8.5 24.7 8.5 22.5c0-2.2.6-4.4 1.7-6.3L2.8 10.5C.9 14.1 0 18.1 0 22.5c0 4.4.9 8.4 2.8 12l7.4-5.7z"/>
            <path fill="#FBBC05" d="M24 46.5c6.6 0 12.2-2.2 16.3-6l-8.4-6.5c-2.3 1.6-5.2 2.6-7.9 2.6-6 0-11.1-4.5-12.9-10.3l-7.4 5.7C6.9 42.8 14.8 46.5 24 46.5z"/>
          </svg>
          <span className="text-sm">Google</span>
        </button>
      </div>
    );
  }

  const shortAddress = embeddedWallet
    ? `${embeddedWallet.address.slice(0, 6)}...${embeddedWallet.address.slice(-4)}`
    : 'Connecting...';

  return (
    <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-1.5 pl-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-mono text-slate-300">{shortAddress}</span>
      </div>
      <button
        onClick={logout}
        title="Disconnect Wallet"
        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
