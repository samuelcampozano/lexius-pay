'use client';

import React, { useEffect, useState } from 'react';
import { Gift, CheckCircle2, ExternalLink, Sparkles, X } from 'lucide-react';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useLanguage } from '@/context/LanguageContext';

export default function WelcomeGiftModal() {
  const { authenticated, walletAddress } = usePrivyAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txDetails, setTxDetails] = useState<{
    txHashUsdc?: string;
    txHashEth?: string;
    amountUsdc?: string;
  } | null>(null);

  useEffect(() => {
    if (!authenticated || !walletAddress) return;

    const storageKey = `lexius_faucet_claimed_${walletAddress.toLowerCase()}`;
    const alreadyClaimed = localStorage.getItem(storageKey);

    if (alreadyClaimed) return;

    // Trigger Welcome Gift claim
    const claimGift = async () => {
      setLoading(true);
      try {
        const oracleUrl =
          process.env.NEXT_PUBLIC_AI_ORACLE_URL || 'http://localhost:8080';
        const res = await fetch(`${oracleUrl}/api/faucet/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress }),
        });

        const data = await res.json();
        if (data.success) {
          localStorage.setItem(storageKey, 'true');
          setTxDetails({
            txHashUsdc: data.txHashUsdc,
            txHashEth: data.txHashEth,
            amountUsdc: data.amountUsdc || '1.00',
          });
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('Welcome Gift auto-claim skipped or failed:', err);
      } finally {
        setLoading(false);
      }
    };

    claimGift();
  }, [authenticated, walletAddress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#060c21] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden glow-cyan">
        {/* Glowing background accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
            <Gift className="w-8 h-8 text-white animate-bounce" />
            <Sparkles className="w-4 h-4 text-cyan-200 absolute -top-1 -right-1" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5 mb-5">
          <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <span>{t('giftTitle')}</span>
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          </h3>
          <p className="text-sm text-slate-300">{t('giftSub')}</p>
        </div>

        {/* Badge Details */}
        <div className="bg-[#030818] border border-cyan-900/50 rounded-2xl p-4 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('giftBonusStable')}</span>
            <span className="text-sm font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
              +1.00 USDC
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('giftGasFee')}</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">
              +0.001 Sepolia ETH
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-cyan-950">
            <span>{t('payNetwork')}</span>
            <span className="font-semibold text-slate-200">Arbitrum Sepolia Testnet</span>
          </div>
        </div>

        {/* Explorer Links */}
        {txDetails?.txHashUsdc && (
          <div className="mb-5 text-center">
            <a
              href={`https://sepolia.arbiscan.io/tx/${txDetails.txHashUsdc}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:underline font-mono"
            >
              <span>{t('giftExplorerLink')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200"
        >
          {t('giftCta')}
        </button>
      </div>
    </div>
  );
}

