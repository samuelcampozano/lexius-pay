'use client';

import React, { useState } from 'react';
import { Shield, Sparkles, Link as LinkIcon, Lock, CheckCircle2, Copy, Send, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('50');
  const [sellerAddress, setSellerAddress] = useState('');
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    const newEscrowId = Math.floor(100 + Math.random() * 900).toString();
    setGeneratedId(newEscrowId);
  };

  const copyToClipboard = () => {
    if (!generatedId) return;
    const url = `${window.location.origin}/pay/${generatedId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative text-center max-w-3xl mx-auto pt-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" />
          <span>Arbitrum Stylus WASM + GCP AI Mediator</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          P2P Social Escrow Links with{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Autonomous AI Mediation
          </span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl font-normal leading-relaxed">
          Create a 10-second payment link for Telegram or WhatsApp. Funds freeze safely in Rust WASM contracts. Conflicts are settled in seconds by GPT-4o Vision on Google Cloud.
        </p>
      </section>

      {/* Generator Form Section */}
      <section className="max-w-xl mx-auto">
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Escrow Link</h2>
              <p className="text-xs text-slate-400">Generate a secure payment agreement in seconds</p>
            </div>
          </div>

          {!generatedId ? (
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Item or Service Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Concert Ticket / Freelance Design Work"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Network
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-blue-400 font-medium text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Arbitrum Sepolia
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Seller Wallet Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="0x... (Leave empty to use your wallet)"
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-base"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate Escrow Link</span>
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Escrow Link Created!</h3>
                <p className="text-xs text-slate-400">Escrow #{generatedId} is ready for sharing on Telegram or WhatsApp</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-blue-400 truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/pay/${generatedId}` : `/pay/${generatedId}`}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/pay/${generatedId}`}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open Payment Page</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setGeneratedId(null)}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 text-sm font-medium rounded-xl border border-slate-800"
                >
                  New Link
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Arbitrum Stylus WASM</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Smart contract written in Rust (`#![no_std]`). Sub-cent gas fees and blazing fast execution on Arbitrum Sepolia.
          </p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">GCP AI Vision Mediator</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            GPT-4o Vision hosted on Google Cloud Run evaluates chat receipts and signs ECDSA verdicts with GCP Secret Manager keys.
          </p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Send className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Telegram Mini App UX</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Zero seed-phrase friction. Connect via Passkeys (FaceID / TouchID) or Google social logins with Privy.
          </p>
        </div>
      </section>
    </div>
  );
}
