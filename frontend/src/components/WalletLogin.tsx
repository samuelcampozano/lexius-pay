'use client';

import React from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { LogOut, ShieldCheck, Loader2 } from 'lucide-react';

export default function WalletLogin() {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();

  // Loading state — Privy initializing
  if (!ready) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
        <span className="text-xs text-slate-400">Connecting…</span>
      </div>
    );
  }

  // ── Authenticated State ───────────────────────────────────────────────────
  if (authenticated) {
    const embeddedWallet =
      wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
    const addr = embeddedWallet?.address;
    const shortAddr = addr
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : 'Wallet';

    const googleMeta = user?.google as
      | { name?: string; picture?: string }
      | undefined;
    const displayName =
      googleMeta?.name ??
      user?.email?.address ??
      user?.telegram?.username ??
      shortAddr;

    return (
      <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-xl p-1.5 pl-3 backdrop-blur-sm">
        {/* Avatar / status dot */}
        <div className="relative flex-shrink-0">
          {googleMeta?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={googleMeta.picture}
              alt="Avatar"
              className="w-6 h-6 rounded-full ring-1 ring-blue-500/40"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
        </div>

        {/* Name + address */}
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate">
            {displayName}
          </span>
          <span className="text-[10px] font-mono text-slate-500">{shortAddr}</span>
        </div>

        {/* Disconnect */}
        <button
          onClick={logout}
          title="Disconnect"
          aria-label="Disconnect wallet"
          className="ml-1 p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ── Unauthenticated State — Single Connect Button ──────────────────────────
  const handleConnect = () => {
    login({
      loginMethods: ['google', 'telegram', 'wallet'],
    } as any);
  };

  return (
    <button
      onClick={handleConnect}
      disabled={!ready}
      aria-label="Connect wallet or sign in"
      className={[
        'group flex items-center gap-2 px-4 py-2.5',
        'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600',
        'hover:from-blue-500 hover:to-purple-500',
        'active:from-blue-700 active:to-purple-700',
        'text-white text-sm font-semibold rounded-xl',
        'shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35',
        'transition-all duration-200 hover:-translate-y-px active:translate-y-0',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
      ].join(' ')}
    >
      <ShieldCheck className="w-4 h-4 opacity-90" />
      <span>Connect</span>
    </button>
  );
}
