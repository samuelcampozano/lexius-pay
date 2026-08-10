'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Wallet,
  ShoppingBag,
  Copy,
  Send,
  RefreshCw,
} from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import WalletLogin from '@/components/WalletLogin';
import { useLanguage } from '@/context/LanguageContext';

export interface EscrowRecord {
  id: string;
  description: string;
  amount: string;
  status: 'Pending' | 'Deposited' | 'Completed' | 'Disputed';
  role: 'Seller' | 'Buyer';
  seller?: string;
  buyer?: string;
  counterparty: string;
  date: string;
  link?: string;
}

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = (
    wallets?.[0]?.address ||
    user?.wallet?.address ||
    ''
  ).toLowerCase();

  const [escrows, setEscrows] = useState<EscrowRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTgId, setActiveTgId] = useState<string | null>(null);
  const [tgInput, setTgInput] = useState<string>('');
  const [tgStatus, setTgStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [tgError, setTgError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserEscrows = () => {
      try {
        const stored: EscrowRecord[] = JSON.parse(
          localStorage.getItem('lexius_user_escrows') || '[]'
        );
        if (activeWallet) {
          // Filter escrows associated with the logged-in user
          const userItems = stored.filter(
            (item) =>
              !item.seller ||
              item.seller.toLowerCase() === activeWallet ||
              item.buyer?.toLowerCase() === activeWallet
          );
          setEscrows(userItems);
        } else {
          setEscrows(stored);
        }
      } catch (e) {
        setEscrows([]);
      }
    };

    loadUserEscrows();
    window.addEventListener('storage', loadUserEscrows);
    window.addEventListener('lexius_escrow_updated', loadUserEscrows);
    const interval = setInterval(loadUserEscrows, 2000);

    return () => {
      window.removeEventListener('storage', loadUserEscrows);
      window.removeEventListener('lexius_escrow_updated', loadUserEscrows);
      clearInterval(interval);
    };
  }, [activeWallet, authenticated]);

  const handleCopyLink = (item: EscrowRecord) => {
    const fullUrl = item.link
      ? `${window.location.origin}${item.link}`
      : `${window.location.origin}/pay/${item.id}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendTgCard = async (item: EscrowRecord) => {
    if (!tgInput.trim()) return;
    setTgStatus('sending');
    setTgError(null);

    let targetChat = tgInput.trim();
    if (!targetChat.startsWith('@') && isNaN(Number(targetChat))) {
      targetChat = `@${targetChat}`;
      setTgInput(targetChat);
    }

    try {
      const oracleUrl = process.env.NEXT_PUBLIC_AI_ORACLE_URL || 'http://localhost:8080';
      const res = await fetch(`${oracleUrl}/api/telegram/send-escrow-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChat,
          escrowId: item.id,
          description: item.description,
          amount: item.amount,
          sellerName: user?.google?.name || user?.email?.address || 'Seller',
          seller: item.seller || activeWallet || '0x0000000000000000000000000000000000000000',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTgStatus('sent');
        setTimeout(() => {
          setTgStatus('idle');
          setActiveTgId(null);
        }, 2000);
      } else {
        setTgStatus('error');
        setTgError(data.error || 'Failed to send card');
      }
    } catch (err: any) {
      setTgStatus('error');
      setTgError(err?.message || 'Error connecting to server');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyan-950 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{t('dashTitle')}</h1>
          <p className="text-xs text-slate-400 mt-1">{t('dashSub')}</p>
        </div>
        <Link
          href="/"
          className="px-5 py-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t('btnGenerate')}</span>
        </Link>
      </div>

      {/* State 1: User Not Logged In */}
      {!authenticated ? (
        <div className="glass-card rounded-2xl p-8 text-center space-y-4 border-cyan-500/30 glow-cyan">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30 shadow-inner">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-white">Conecta tu cuenta para ver tus Escrows</h2>
            <p className="text-xs text-slate-300">
              Inicia sesión con Google, Telegram o tu Billetera para rastrear tus compras, ventas y disputas activas.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <WalletLogin />
          </div>
        </div>
      ) : escrows.length === 0 ? (
        /* State 2: Logged In but No Escrows Yet */
        <div className="glass-card rounded-2xl p-8 text-center space-y-4 border-cyan-500/20">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30 shadow-inner">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-white">No tienes acuerdos de escrow activos</h2>
            <p className="text-xs text-slate-300">
              Crea tu primer enlace de escrow seguro respaldado por Arbitrum Stylus WASM e IA.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-500/25"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Enlace de Escrow</span>
            </Link>
          </div>
        </div>
      ) : (
        /* State 3: User Escrow List */
        <div className="space-y-4">
          {escrows.map((item) => (
            <div
              key={item.id}
              className="glass-card glass-card-hover rounded-2xl p-6 space-y-4 border-cyan-500/20"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
                      #{item.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 bg-[#060e28] border border-cyan-950 px-2.5 py-0.5 rounded">
                      {item.role === 'Seller' ? t('roleSeller') : t('roleBuyer')}
                    </span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{item.date}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{item.description}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {t('counterpartyLabel')}{' '}
                    {item.counterparty === 'En espera' || !item.counterparty || item.counterparty.includes('espera')
                      ? t('waitingBuyer')
                      : item.counterparty}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-cyan-950 pt-3 sm:pt-0">
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-white font-mono">{item.amount} USDC</span>
                    <div className="mt-1">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          item.status === 'Pending'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                            : item.status === 'Deposited'
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                            : item.status === 'Disputed'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {item.status === 'Pending'
                          ? t('statusPending')
                          : item.status === 'Deposited'
                          ? t('statusDeposited')
                          : item.status === 'Completed'
                          ? t('statusCompleted')
                          : t('statusDisputed')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(item)}
                      className="p-2.5 bg-[#070e24] hover:bg-cyan-950 text-cyan-300 rounded-xl border border-cyan-900/40 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      title={t('btnCopyLink')}
                    >
                      <Copy className="w-4 h-4 text-cyan-400" />
                      <span className="hidden md:inline">
                        {copiedId === item.id ? t('copied') : t('btnCopyLink')}
                      </span>
                    </button>

                    {item.status === 'Pending' && (
                      <button
                        onClick={() =>
                          setActiveTgId(activeTgId === item.id ? null : item.id)
                        }
                        className="p-2.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        title={t('btnShareTg')}
                      >
                        <Send className="w-4 h-4 text-cyan-400" />
                        <span className="hidden md:inline">{t('btnShareTg')}</span>
                      </button>
                    )}

                    <Link
                      href={item.link || `/pay/${item.id}`}
                      className="p-2.5 bg-[#070e24] hover:bg-cyan-950 text-cyan-300 rounded-xl border border-cyan-900/40 transition-colors shadow-sm"
                      title="Abrir Enlace"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    {item.status === 'Disputed' && (
                      <Link
                        href={`/dispute/${item.id}`}
                        className="px-3.5 py-2.5 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-500/50 rounded-xl transition-all shadow-md flex items-center gap-1.5 text-xs font-bold shrink-0 animate-pulse"
                        title="Centro de Disputas IA — Subir Evidencia y Defenderse"
                      >
                        <Sparkles className="w-4 h-4 text-purple-300" />
                        <span>{lang === 'es' ? '⚖️ Defenderse en IA ↗' : '⚖️ Defend in AI ↗'}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline Telegram Share Drawer for Pending Orders */}
              {activeTgId === item.id && (
                <div className="pt-3 border-t border-cyan-950 space-y-2.5 animate-in fade-in">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('tgPlaceholder')}
                      value={tgInput}
                      onChange={(e) => setTgInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#030818] border border-cyan-900/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                    />
                    <button
                      onClick={() => handleSendTgCard(item)}
                      disabled={!tgInput.trim() || tgStatus === 'sending'}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-md shadow-cyan-600/20"
                    >
                      {tgStatus === 'sending' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : tgStatus === 'sent' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {tgStatus === 'sending'
                          ? t('tgBtnSending')
                          : tgStatus === 'sent'
                          ? t('tgBtnSent')
                          : t('tgBtnSend')}
                      </span>
                    </button>
                  </div>
                  {tgError && (
                    <p className="text-[11px] font-semibold text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-500/30">
                      ⚠️ {tgError}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {t('tgHelperText')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

