'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Sparkles, ExternalLink, Clock, CheckCircle2, AlertCircle, Plus, Wallet, ShoppingBag } from 'lucide-react';
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
  const { t } = useLanguage();
  const { authenticated, login, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = (
    wallets?.[0]?.address ||
    user?.wallet?.address ||
    ''
  ).toLowerCase();

  const [escrows, setEscrows] = useState<EscrowRecord[]>([]);

  useEffect(() => {
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
  }, [activeWallet, authenticated]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{t('dashTitle')}</h1>
          <p className="text-xs text-slate-400 mt-1">{t('dashSub')}</p>
        </div>
        <Link
          href="/"
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t('btnGenerate')}</span>
        </Link>
      </div>

      {/* State 1: User Not Logged In */}
      {!authenticated ? (
        <div className="glass-card rounded-2xl p-8 text-center space-y-4 border-blue-500/30">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20 shadow-inner">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-white">Conecta tu cuenta para ver tus Escrows</h2>
            <p className="text-xs text-slate-400">
              Inicia sesión con Google, Telegram o tu Billetera para rastrear tus compras, ventas y disputas activas.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <WalletLogin />
          </div>
        </div>
      ) : escrows.length === 0 ? (
        /* State 2: Logged In but No Escrows Yet */
        <div className="glass-card rounded-2xl p-8 text-center space-y-4 border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-white">No tienes acuerdos de escrow activos</h2>
            <p className="text-xs text-slate-400">
              Crea tu primer enlace de escrow seguro respaldado por Arbitrum Stylus WASM e IA.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
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
              className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    #{item.id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{item.role}</span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-500">{item.date}</span>
                </div>
                <h3 className="font-bold text-white text-base">{item.description}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Counterparty: {item.counterparty || 'En espera'}
                </p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-slate-800 pt-3 sm:pt-0">
                <div className="text-right">
                  <span className="text-lg font-bold text-white font-mono">{item.amount}</span>
                  <div className="mt-1">
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        item.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : item.status === 'Deposited'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : item.status === 'Disputed'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
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

                <div className="flex gap-2">
                  <Link
                    href={item.link || `/pay/${item.id}`}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
                    title="View Escrow"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  {item.status === 'Disputed' && (
                    <Link
                      href={`/dispute/${item.id}`}
                      className="p-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl transition-colors"
                      title="Open AI Dispute Center"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
