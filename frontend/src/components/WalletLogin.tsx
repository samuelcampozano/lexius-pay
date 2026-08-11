'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import {
  LogOut,
  ShieldCheck,
  Loader2,
  Mail,
  Wallet,
  ChevronDown,
  PlusCircle,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function WalletLogin() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkWallet,
    linkGoogle,
    linkEmail,
    createWallet,
  } = usePrivy();
  const { wallets } = useWallets();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reactive constants for linked accounts
  const linkedAccounts = user?.linkedAccounts || [];
  const hasEmail = linkedAccounts.some((acc: any) => acc.type === 'email');
  const hasGoogle = linkedAccounts.some((acc: any) => acc.type === 'google_oauth');
  
  // Detect external wallet (MetaMask, Coinbase Wallet, etc.) vs Privy embedded wallet
  const hasExternalWallet = linkedAccounts.some(
    (acc: any) => acc.type === 'wallet' && acc.walletClientType !== 'privy'
  );
  const hasEmbeddedWallet = linkedAccounts.some(
    (acc: any) => acc.type === 'wallet' && acc.walletClientType === 'privy'
  );

  // Auto-create embedded Privy wallet if missing
  useEffect(() => {
    if (authenticated && ready && !hasEmbeddedWallet && createWallet) {
      createWallet().catch((err) => {
        console.warn('[WalletLogin] Auto-create embedded wallet skipped:', err);
      });
    }
  }, [authenticated, ready, hasEmbeddedWallet, createWallet]);

  // Loading state — Privy initializing
  if (!ready) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#070e24] border border-cyan-950">
        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
        <span className="text-xs text-slate-400">{t('btnConnecting')}</span>
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

    // Determine primary login method
    let primaryMethod = 'Google / Correo';
    if (user?.google) primaryMethod = 'Google';
    else if (user?.email) primaryMethod = 'Correo';
    else if (user?.wallet && !hasEmbeddedWallet) primaryMethod = 'Cartera Web3 Externa';
    else if (user?.telegram) primaryMethod = 'Telegram';

    return (
      <div className="relative inline-block" ref={menuRef}>
        {/* Main User Pill */}
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 bg-[#070e24] border border-cyan-500/30 rounded-xl p-1.5 pl-3 backdrop-blur-md shadow-lg shadow-cyan-500/10 hover:border-cyan-400/60 transition-all duration-200"
        >
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
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-semibold text-slate-100 max-w-[110px] truncate">
              {displayName}
            </span>
            <span className="text-[10px] font-mono text-cyan-300/80">{shortAddr}</span>
          </div>

          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-cyan-400' : ''}`} />
        </button>

        {/* Dropdown Panel Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-[#070e24]/95 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header: Welcome & Primary Access Method */}
            <div className="mb-3 pb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sesión activa vía <strong className="text-cyan-300 font-semibold">{primaryMethod}</strong></span>
              </div>
              <div className="text-sm font-bold text-white truncate">{displayName}</div>
              <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{addr || 'Sin dirección'}</div>
            </div>

            {/* Account Linking Section */}
            <div className="space-y-2 mb-4">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-0.5 flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3 text-cyan-400" />
                <span>Vincular Cuentas</span>
              </div>

              {/* Botón de Vincular Cartera Web3 Externa (MetaMask, Coinbase Wallet, etc.) */}
              {!hasExternalWallet && (
                <button
                  onClick={() => {
                    linkWallet();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/50 hover:border-cyan-400 text-xs font-bold text-cyan-200 hover:text-white shadow-md shadow-cyan-500/10 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>👉 Vincular Cartera Web3 / MetaMask</span>
                  </div>
                </button>
              )}

              {/* Botones Sociales (Google y Correo) */}
              {!hasGoogle && (
                <button
                  onClick={() => {
                    linkGoogle();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-xs font-medium text-slate-200 hover:text-cyan-300 transition-all duration-150"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29c-1.63 3.25-1.63 7.09 0 10.34l3.99-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Vincular Google</span>
                </button>
              )}

              {!hasEmail && (
                <button
                  onClick={() => {
                    linkEmail();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-xs font-medium text-slate-200 hover:text-cyan-300 transition-all duration-150"
                >
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>Vincular Correo</span>
                </button>
              )}

              {/* Crear Cartera Embebida si falta */}
              {!hasEmbeddedWallet && createWallet && (
                <button
                  onClick={() => {
                    createWallet();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-xs font-medium text-slate-200 hover:text-cyan-300 transition-all duration-150"
                >
                  <PlusCircle className="w-4 h-4 text-cyan-400" />
                  <span>Crear Cartera Embebida</span>
                </button>
              )}

              {/* Si todo está totalmente vinculado */}
              {hasEmail && hasGoogle && hasExternalWallet && hasEmbeddedWallet && (
                <div className="px-3 py-2 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300 text-center font-medium">
                  ✓ Todas tus cuentas están vinculadas
                </div>
              )}
            </div>

            {/* Logout Button */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors duration-150"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('btnDisconnect')}</span>
              </button>
            </div>
          </div>
        )}
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
      aria-label={t('btnConnect')}
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
      <span>{t('btnConnect')}</span>
    </button>
  );
}
