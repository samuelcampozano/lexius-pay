'use client';

import React, { useEffect, useState } from 'react';
import { Gift, CheckCircle2, ExternalLink, Sparkles, X } from 'lucide-react';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';

export default function WelcomeGiftModal() {
  const { authenticated, walletAddress } = usePrivyAuth();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Glowing background accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Gift className="w-8 h-8 text-white animate-bounce" />
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5 mb-5">
          <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <span>Welcome Gift Claimed!</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </h3>
          <p className="text-sm text-slate-300">
            We funded your account with testnet assets so you can try Lexius Pay immediately!
          </p>
        </div>

        {/* Badge Details */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Bonus Stablecoin</span>
            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
              +1.00 USDC
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Arbitrum Gas Fee</span>
            <span className="text-sm font-semibold text-blue-400">
              +0.001 Sepolia ETH
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-700/60">
            <span>Network</span>
            <span>Arbitrum Sepolia Testnet</span>
          </div>
        </div>

        {/* Explorer Links */}
        {txDetails?.txHashUsdc && (
          <div className="mb-5 text-center">
            <a
              href={`https://sepolia.arbiscan.io/tx/${txDetails.txHashUsdc}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline font-mono"
            >
              <span>View USDC Transfer on Arbiscan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
        >
          Start Exploring Escrows 🚀
        </button>
      </div>
    </div>
  );
}
