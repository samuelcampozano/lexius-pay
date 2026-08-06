'use client';

import React from 'react';
import { LogOut, ShieldCheck, Chrome, KeyRound, Loader2 } from 'lucide-react';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';

// ─── Google colour palette ──────────────────────────────────────────────────
const GOOGLE_BLUE = '#4285F4';

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function WalletLogin() {
  const { login, googleLogin, logout, authenticated, ready, user, embeddedWallet, isTMA } =
    usePrivyAuth();

  // Loading state — Privy hasn't initialised yet
  if (!ready) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
        <span className="text-xs text-slate-400">Connecting…</span>
      </div>
    );
  }

  // ── Authenticated state ───────────────────────────────────────────────────
  if (authenticated) {
    const addr = embeddedWallet?.address;
    const shortAddr = addr
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : 'Wallet';

    // Privy v1.x Google type doesn't expose all fields; cast safely.
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

  // ── Unauthenticated state — dual CTA ──────────────────────────────────────
  return (
    <div className="flex items-center gap-2">
      {/* Google Login — primary CTA */}
      <button
        onClick={googleLogin}
        aria-label="Sign in with Google"
        title={isTMA ? 'Google login (redirect)' : 'Sign in with Google'}
        className={[
          'group flex items-center gap-2 px-4 py-2.5',
          'bg-white hover:bg-gray-50 active:bg-gray-100',
          'text-[#1f1f1f] text-sm font-medium',
          'rounded-xl border border-gray-200',
          'shadow-sm hover:shadow-md active:shadow-sm',
          'transition-all duration-200 hover:-translate-y-px active:translate-y-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          `focus-visible:ring-[${GOOGLE_BLUE}]`,
        ].join(' ')}
      >
        <GoogleIcon size={16} />
        <span className="hidden sm:inline">Continue with Google</span>
        <span className="sm:hidden">Google</span>
      </button>

      {/* Passkey / other — secondary CTA */}
      <button
        onClick={login}
        aria-label="Connect wallet or passkey"
        className={[
          'group flex items-center gap-2 px-4 py-2.5',
          'bg-gradient-to-r from-blue-600 to-indigo-600',
          'hover:from-blue-500 hover:to-indigo-500',
          'active:from-blue-700 active:to-indigo-700',
          'text-white text-sm font-medium rounded-xl',
          'shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30',
          'transition-all duration-200 hover:-translate-y-px active:translate-y-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
        ].join(' ')}
      >
        <KeyRound className="w-4 h-4 opacity-90" />
        <span className="hidden sm:inline">Passkey</span>
        <span className="sm:hidden">
          <ShieldCheck className="w-4 h-4" />
        </span>
      </button>
    </div>
  );
}
