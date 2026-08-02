'use client';

import React from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Wallet, LogOut, ShieldCheck } from 'lucide-react';

export default function WalletLogin() {
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <ShieldCheck className="w-4 h-4" />
        <span>Connect / Passkey</span>
      </button>
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
