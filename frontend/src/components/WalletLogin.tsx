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
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#070e24] border border-cyan-950">
        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
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
      <div className="flex items-center gap-2.5 bg-[#070e24] border border-cyan-500/30 rounded-xl p-1.5 pl-3 backdrop-blur-md shadow-lg shadow-cyan-500/10">
        {/* Avatar / status dot */}
        <div className="relative flex-shrink-0">
          {googleMeta?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={googleMeta.picture}
              alt="Avatar"
              className="w-6.5 h-6.5 rounded-full ring-1 ring-cyan-400/60"
            />
          ) : (
            <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#040814]" />
        </div>

        {/* Name + address */}
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-slate-100 max-w-[110px] truncate">
            {displayName}
          </span>
          <span className="text-[10px] font-mono text-cyan-300/80">{shortAddr}</span>
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
        'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600',
        'hover:from-cyan-400 hover:to-blue-500',
        'active:from-cyan-600 active:to-blue-700',
        'text-white text-xs font-bold rounded-xl',
        'shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40',
        'transition-all duration-200 hover:-translate-y-px active:translate-y-0',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500',
      ].join(' ')}
    >
      <ShieldCheck className="w-4 h-4 opacity-90 text-white" />
      <span>Connect</span>
    </button>
  );
}

