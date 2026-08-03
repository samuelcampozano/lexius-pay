'use client';

import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  Link as LinkIcon,
  Lock,
  CheckCircle2,
  Copy,
  Send,
  ArrowRight,
  Zap,
  Cpu,
  RefreshCw,
  Scale,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const { lang, t } = useLanguage();

  const [description, setDescription] = useState(
    lang === 'es' ? 'Entrada VIP Concierto — ETH Lima Afterparty 2026' : 'VIP Concert Ticket — ETH Lima Afterparty 2026'
  );
  const [amount, setAmount] = useState(50);
  const [sellerName, setSellerName] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // AI Simulator State
  const [simulatingAI, setSimulatingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    const newEscrowId = Math.floor(100 + Math.random() * 900).toString();
    const params = new URLSearchParams({
      description,
      amount: String(amount),
      seller: sellerAddress,
      sellerName: sellerName,
    });
    const nextLink = `/pay/${newEscrowId}?${params.toString()}`;
    setGeneratedId(newEscrowId);
    setGeneratedLink(nextLink);
  };

  const copyToClipboard = () => {
    if (!generatedId) return;
    const url = `${window.location.origin}${generatedLink ?? `/pay/${generatedId}`}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const runAISimulator = () => {
    setSimulatingAI(true);
    setAiResult(null);

    setTimeout(() => {
      setSimulatingAI(false);
      setAiResult({
        escrowId: '101',
        winner: '0x3C44CdD459193653841586395bcfA5A7b42d506e (' + (lang === 'es' ? 'Comprador' : 'Buyer') + ')',
        confidenceScore: 0.98,
        reasoning: t('sampleReasoning'),
        summary: t('buyerWinner'),
        signature: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
        v: 27,
        r: '0x1111111111111111111111111111111111111111111111111111111111111111',
        s: '0x2222222222222222222222222222222222222222222222222222222222222222',
        oracleHost: 'Google Cloud Run (us-central1)',
      });
    }, 1800);
  };

  return (
    <div className="space-y-20 pb-16">
      {/* HERO SECTION */}
      <section className="relative text-center max-w-4xl mx-auto pt-6 space-y-6">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider shadow-inner">
          <Zap className="w-3.5 h-3.5" />
          <span>{t('heroBadge')}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.15]">
          {t('heroTitle1')}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            {t('heroTitleGradient')}
          </span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl font-normal leading-relaxed max-w-2xl mx-auto">
          {t('heroSub')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="#generator"
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 text-base"
          >
            <LinkIcon className="w-5 h-5" />
            <span>{t('btnGenerate')}</span>
          </a>
          <a
            href="#ai-simulator"
            className="px-6 py-3.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 font-semibold rounded-xl transition-all flex items-center gap-2 text-base"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>{t('btnDemo')}</span>
          </a>
        </div>
      </section>

      {/* INTERACTIVE LINK GENERATOR MODAL */}
      <section id="generator" className="max-w-xl mx-auto scroll-mt-24">
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 glow-blue">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('genTitle')}</h2>
                <p className="text-xs text-slate-400">{t('genSub')}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full uppercase">
              {t('genWasmBadge')}
            </span>
          </div>

          {!generatedId ? (
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('labelDesc')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('placeholderDesc')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {t('labelAmount')}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {t('labelNetwork')}
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-blue-400 font-medium text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    Arbitrum Sepolia
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('labelSellerName')}
                </label>
                <input
                  type="text"
                  placeholder={t('placeholderSellerName')}
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {t('labelSeller')}
                </label>
                <input
                  type="text"
                  placeholder={t('placeholderSeller')}
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-base active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t('btnCreate')}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">{t('createdTitle')}</h3>
                <p className="text-xs text-slate-400">{t('createdSub')}</p>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left">
                <div className="text-xs text-slate-400">
                  <p className="font-semibold text-white">{description}</p>
                  <p className="mt-1">Amount: {amount} USDC</p>
                  {sellerName ? <p className="mt-1">{t('paySeller')}: {sellerName}</p> : null}
                  {sellerAddress ? <p className="mt-1 font-mono text-[11px]">{sellerAddress}</p> : null}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-blue-400 truncate">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}${generatedLink ?? `/pay/${generatedId}`}`
                      : `${generatedLink ?? `/pay/${generatedId}`}`}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopied ? t('copied') : t('btnCopy')}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href={generatedLink ?? `/pay/${generatedId}`}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>{t('btnPayPage')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => {
                    setGeneratedId(null);
                    setGeneratedLink(null);
                  }}
                  className="px-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-400 text-sm font-medium rounded-xl border border-slate-800"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AI MEDIATOR SIMULATOR SECTION */}
      <section id="ai-simulator" className="max-w-4xl mx-auto scroll-mt-24 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('simBadge')}</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">{t('simTitle')}</h2>
          <p className="text-xs text-slate-400">{t('simSub')}</p>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border-purple-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{t('sampleClaimTitle')}</h3>
                <p className="text-xs text-slate-400">{t('sampleClaimSub')}</p>
              </div>
            </div>
            <button
              onClick={runAISimulator}
              disabled={simulatingAI}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {simulatingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('simulatingAi')}</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>{t('btnRunAi')}</span>
                </>
              )}
            </button>
          </div>

          {/* AI Verdict Output */}
          {aiResult && (
            <div className="bg-slate-950 p-6 rounded-xl border border-purple-500/40 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 glow-purple">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {t('verdictTitle')}
                </span>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                  {t('confidenceLabel')} {Math.round(aiResult.confidenceScore * 100)}%
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-900 p-3 rounded-lg border border-slate-800">
                {aiResult.reasoning}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block mb-1 text-[10px] uppercase font-semibold">
                    {t('winnerLabel')}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold truncate block">{aiResult.winner}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block mb-1 text-[10px] uppercase font-semibold">
                    {t('hostLabel')}
                  </span>
                  <span className="font-mono text-blue-400 font-bold truncate block">{aiResult.oracleHost}</span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono text-[10px] space-y-1 text-slate-400">
                <div className="truncate">{t('signatureLabel')} {aiResult.signature}</div>
                <div className="flex gap-4 text-slate-500">
                  <span>v: {aiResult.v}</span>
                  <span className="truncate">r: {aiResult.r.slice(0, 16)}...</span>
                  <span className="truncate">s: {aiResult.s.slice(0, 16)}...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FEATURE PILLARS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">{t('pillar1Title')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t('pillar1Desc')}</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">{t('pillar2Title')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t('pillar2Desc')}</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Send className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">{t('pillar3Title')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t('pillar3Desc')}</p>
        </div>
      </section>
    </div>
  );
}

