'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, Lock, CheckCircle2, AlertTriangle, ArrowUpRight, Sparkles, RefreshCw } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Link from 'next/link';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const escrowId = (params.id as string) || '101';

  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const [status, setStatus] = useState<'Pending' | 'Deposited' | 'Completed' | 'Disputed'>('Pending');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const mockEscrow = {
    id: escrowId,
    description: 'VIP Concert Ticket — ETH Lima Afterparty 2026',
    amount: '50.00 USDC',
    seller: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    buyer: wallets[0]?.address || '0x3C44CdD459193653841586395bcfA5A7b42d506e',
    network: 'Arbitrum Sepolia Testnet',
  };

  const handleDeposit = async () => {
    if (!authenticated) {
      login();
      return;
    }
    setLoading(true);
    // Simulate transaction execution on Arbitrum Stylus contract
    setTimeout(() => {
      setStatus('Deposited');
      setTxHash('0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b');
      setLoading(false);
    }, 1500);
  };

  const handleRelease = async () => {
    setLoading(true);
    setTimeout(() => {
      setStatus('Completed');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
          &larr; Back to Generator
        </Link>
        <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
          Escrow #{escrowId}
        </span>
      </div>

      {/* Main Payment Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Lexius Escrow Agreement</h1>
              <p className="text-xs text-slate-400">Arbitrum Stylus WASM Contract</p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
              status === 'Pending'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : status === 'Deposited'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : status === 'Completed'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
            }`}
          >
            {status}
          </span>
        </div>

        {/* Item & Price Details */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Item Description</span>
            <p className="text-sm font-semibold text-white mt-0.5">{mockEscrow.description}</p>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-900">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Amount</span>
              <p className="text-2xl font-black text-blue-400 font-mono">{mockEscrow.amount}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Network</span>
              <p className="text-xs text-slate-300 font-medium">{mockEscrow.network}</p>
            </div>
          </div>
        </div>

        {/* Party Addresses */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 font-medium block mb-1">Seller</span>
            <span className="font-mono text-slate-300 truncate block">{mockEscrow.seller}</span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 font-medium block mb-1">Buyer (You)</span>
            <span className="font-mono text-slate-300 truncate block">{mockEscrow.buyer}</span>
          </div>
        </div>

        {/* Tx Hash Toast */}
        {txHash && (
          <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center justify-between">
            <span className="font-mono truncate">Tx: {txHash}</span>
            <a
              href={`https://sepolia.arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
            >
              <span>Scan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {status === 'Pending' && (
            <button
              onClick={handleDeposit}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>{authenticated ? 'Lock Funds in Escrow (50 USDC)' : 'Connect Passkey & Deposit'}</span>
                </>
              )}
            </button>
          )}

          {status === 'Deposited' && (
            <div className="space-y-3">
              <button
                onClick={handleRelease}
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Receipt & Release Funds to Seller</span>
              </button>

              <Link
                href={`/dispute/${escrowId}`}
                className="w-full py-3 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Open AI Dispute Resolution Center</span>
              </Link>
            </div>
          )}

          {status === 'Completed' && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white">Escrow Released Successfully!</h3>
              <p className="text-xs text-slate-400">Funds transferred to seller on Arbitrum Sepolia.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
