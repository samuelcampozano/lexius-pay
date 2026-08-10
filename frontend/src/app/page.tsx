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
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { useLanguage } from '@/context/LanguageContext';
import { cacheWalletAddress, getCachedWalletAddress } from '@/lib/telegram';
import UseCaseSelector from '@/components/UseCaseSelector';
import EscrowSimulator from '@/components/EscrowSimulator';
import { STYLUS_ESCROW_ADDRESS, STYLUS_ESCROW_ABI } from '@/lib/contracts';

export default function HomePage() {
  const { lang, t } = useLanguage();
  const { authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();

  const activeWalletAddress = wallets?.[0]?.address || user?.wallet?.address || '';

  const [description, setDescription] = useState(
    lang === 'es' ? 'Entrada VIP Concierto — ETH Lima Afterparty 2026' : 'VIP Concert Ticket — ETH Lima Afterparty 2026'
  );
  const [amount, setAmount] = useState(50);
  const [sellerName, setSellerName] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [tgShareStatus, setTgShareStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [tgShareError, setTgShareError] = useState<string | null>(null);

  // Auto-fill seller address and name ONLY when the user is logged in
  React.useEffect(() => {
    if (authenticated) {
      if (activeWalletAddress && !sellerAddress) {
        setSellerAddress(activeWalletAddress);
        // Cache wallet address for TMA instant auto-fill
        cacheWalletAddress(activeWalletAddress);
      }
      if (!sellerName) {
        if (user?.google?.name) {
          setSellerName(user.google.name);
        } else if (user?.email?.address) {
          setSellerName(user.email.address);
        }
      }
    } else {
      // Before Privy loads, try to restore cached wallet for instant fill
      const cached = getCachedWalletAddress();
      if (cached && !sellerAddress) {
        setSellerAddress(cached);
      }
    }
  }, [authenticated, activeWalletAddress, user]);

  // AI Simulator State
  const [simulatingAI, setSimulatingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();

    // If no seller address provided and user isn't logged in, prompt Privy login so seller gets paid!
    if (!authenticated && !sellerAddress.trim()) {
      login();
      return;
    }

    let storedEscrows: any[] = [];
    try {
      storedEscrows = JSON.parse(localStorage.getItem('lexius_user_escrows') || '[]');
    } catch (e) {}

    let nextIdNum = storedEscrows.length + 1;

    // Fetch actual on-chain escrow count from Arbitrum Sepolia to prevent ID collisions
    try {
      const publicClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(process.env.NEXT_PUBLIC_STYLUS_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'),
      });
      const count = (await publicClient.readContract({
        address: STYLUS_ESCROW_ADDRESS,
        abi: STYLUS_ESCROW_ABI,
        functionName: 'getEscrowCount',
      })) as bigint;

      const onChainNextId = Number(count) + 1;
      if (onChainNextId > nextIdNum) {
        nextIdNum = onChainNextId;
      }
    } catch (err) {
      console.warn('[handleCreateLink] Could not fetch on-chain count, using fallback local index:', err);
    }

    const newEscrowId = String(nextIdNum);
    const finalSeller =
      sellerAddress.trim() ||
      activeWalletAddress ||
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
    const finalSellerName =
      sellerName.trim() ||
      (authenticated ? user?.google?.name || user?.email?.address || 'Vendedor' : 'Vendedor');

    const params = new URLSearchParams({
      description,
      amount: String(amount),
      seller: finalSeller,
      sellerName: finalSellerName,
    });
    const nextLink = `/pay/${newEscrowId}?${params.toString()}`;

    // Save to local storage for user's dashboard tracking
    try {
      const existing = JSON.parse(
        localStorage.getItem('lexius_user_escrows') || '[]'
      );
      const newEscrowRecord = {
        id: newEscrowId,
        description,
        amount: `${amount} USDC`,
        status: 'Pending',
        role: 'Seller',
        seller: finalSeller,
        sellerName: finalSellerName,
        counterparty: 'En espera de comprador',
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        link: nextLink,
      };
      localStorage.setItem(
        'lexius_user_escrows',
        JSON.stringify([newEscrowRecord, ...existing])
      );
    } catch (e) {}

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



  /** Share escrow card to a Telegram chat via the bot */
  const shareToTelegram = async () => {
    if (!generatedId || !telegramChatId.trim()) return;
    setTgShareStatus('sending');
    setTgShareError(null);

    // Auto format username if missing leading @
    let formattedChat = telegramChatId.trim();
    if (!formattedChat.startsWith('@') && isNaN(Number(formattedChat))) {
      formattedChat = `@${formattedChat}`;
      setTelegramChatId(formattedChat);
    }

    try {
      const oracleUrl = process.env.NEXT_PUBLIC_AI_ORACLE_URL || 'http://localhost:8080';
      const finalSeller = sellerAddress.trim() || activeWalletAddress || '0x0000000000000000000000000000000000000000';
      const res = await fetch(`${oracleUrl}/api/telegram/send-escrow-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: formattedChat,
          escrowId: generatedId,
          description,
          amount: String(amount),
          sellerName: sellerName.trim(),
          seller: finalSeller,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Store the Telegram message context for future status updates
        localStorage.setItem(`lexius_tg_msg_${generatedId}`, JSON.stringify({
          chatId: formattedChat,
          messageId: data.messageId,
        }));
        setTgShareStatus('sent');
      } else {
        setTgShareStatus('error');
        setTgShareError(data.error || 'Failed to send card to Telegram');
      }
    } catch (err: any) {
      setTgShareStatus('error');
      setTgShareError(err?.message || 'Error connecting to Telegram Bot API');
    }
    setTimeout(() => {
      setTgShareStatus('idle');
    }, 5000);
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
    <div className="space-y-24 pb-16 relative">
      {/* HERO SECTION */}
      <section className="relative text-center max-w-4xl mx-auto pt-6 space-y-8">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-cyan-500/20 via-blue-600/15 to-indigo-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        {/* Hero Logo Emblem Presentation */}
        <div className="flex justify-center mb-2">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-600 opacity-50 blur-md group-hover:opacity-100 transition-opacity duration-500 animate-pulse-cyan" />
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-[#060d24] border border-cyan-500/40 p-3.5 flex items-center justify-center shadow-2xl shadow-cyan-500/30 animate-float-logo">
              <img
                src="/lexius-logo.png"
                alt="Lexius Shield Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,229,255,0.8)]"
              />
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-cyan-500/10">
          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{t('heroBadge')}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12]">
          {t('heroTitle1')}
          <span className="text-gradient-cyan drop-shadow-[0_0_20px_rgba(0,229,255,0.3)]">
            {t('heroTitleGradient')}
          </span>
        </h1>

        <p className="text-slate-300 text-lg sm:text-xl font-normal leading-relaxed max-w-2xl mx-auto">
          {t('heroSub')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <a
            href="#generator"
            className="px-7 py-4 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center gap-2 text-base active:scale-98"
          >
            <LinkIcon className="w-5 h-5 text-white" />
            <span>{t('btnGenerate')}</span>
          </a>
          <a
            href="#ai-simulator"
            className="px-7 py-4 bg-[#08122c] hover:bg-[#0c1b42] text-cyan-200 border border-cyan-500/30 font-semibold rounded-xl transition-all flex items-center gap-2 text-base shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>{t('btnDemo')}</span>
          </a>
          <Link
            href="/learn"
            className="px-6 py-4 bg-[#060c21] hover:bg-[#091436] text-cyan-300 border border-cyan-800/40 font-semibold rounded-xl transition-all flex items-center gap-2 text-base shadow-lg hover:border-cyan-400/50"
          >
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>{lang === 'es' ? '💡 ¿Nuevo en Web3? Aprende los Términos' : '💡 New to Web3? Learn Terms'}</span>
          </Link>
        </div>
      </section>

      {/* INTERACTIVE LINK GENERATOR MODAL */}
      <section id="generator" className="max-w-xl mx-auto scroll-mt-24">
        <div className="glass-card rounded-3xl p-6 sm:p-9 space-y-6 border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between border-b border-cyan-950/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-cyan-950/80 text-cyan-400 rounded-2xl border border-cyan-500/30 flex items-center justify-center shadow-inner">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('genTitle')}</h2>
                <p className="text-xs text-slate-400">{t('genSub')}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full uppercase shadow-inner">
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
                  className="w-full px-4 py-3.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm transition-all"
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
                    value={amount === 0 ? '' : amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setAmount(0);
                      } else {
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed) && parsed >= 0) {
                          setAmount(parsed);
                        }
                      }
                    }}
                    className="w-full px-4 py-3.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm font-mono transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {t('labelNetwork')}
                  </label>
                  <div className="w-full px-4 py-3.5 bg-[#060e28] border border-cyan-900/40 rounded-xl text-cyan-300 font-semibold text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
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
                  className="w-full px-4 py-3.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm transition-all"
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
                  className="w-full px-4 py-3.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm font-mono transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 text-base active:scale-98"
              >
                <Sparkles className="w-5 h-5 text-white" />
                <span>{t('btnCreate')}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">{t('createdTitle')}</h3>
                <p className="text-xs text-slate-400">{t('createdSub')}</p>
              </div>

              <div className="space-y-3 rounded-2xl border border-cyan-900/40 bg-[#030818] p-4 text-left">
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-white text-sm">{description}</p>
                  <p className="text-cyan-400 font-mono">Monto: {amount} USDC</p>
                  {sellerName ? <p className="text-slate-400">{t('paySeller')}: {sellerName}</p> : null}
                  {sellerAddress ? <p className="font-mono text-[11px] text-slate-400">{sellerAddress}</p> : null}
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-900">
                  <span className="text-xs font-mono text-cyan-300 truncate">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}${generatedLink ?? `/pay/${generatedId}`}`
                      : `${generatedLink ?? `/pay/${generatedId}`}`}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-md shadow-cyan-600/20"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopied ? t('copied') : t('btnCopy')}</span>
                  </button>
                </div>
              </div>

              {/* Share via Telegram Bot */}
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    {t('tgShareTitle')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('tgPlaceholder')}
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                  />
                  <button
                    onClick={shareToTelegram}
                    disabled={!telegramChatId.trim() || tgShareStatus === 'sending'}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-md shadow-cyan-600/20"
                  >
                    {tgShareStatus === 'sending' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : tgShareStatus === 'sent' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {tgShareStatus === 'sending'
                        ? t('tgBtnSending')
                        : tgShareStatus === 'sent'
                        ? t('tgBtnSent')
                        : tgShareStatus === 'error'
                        ? t('tgBtnError')
                        : t('tgBtnSend')}
                    </span>
                  </button>
                </div>
                {tgShareError && (
                  <p className="text-[11px] font-semibold text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-500/30">
                    ⚠️ {tgShareError}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {t('tgHelperText')}
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  href={generatedLink ?? `/pay/${generatedId}`}
                  className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <span>{t('btnPayPage')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => {
                    setGeneratedId(null);
                    setGeneratedLink(null);
                    setTgShareStatus('idle');
                    setTelegramChatId('');
                  }}
                  className="px-4 py-3.5 bg-[#070e24] hover:bg-[#0b173c] text-slate-300 text-sm font-medium rounded-xl border border-cyan-900/40"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 1: INTERACTIVE USE CASE SELECTOR */}
      <section id="use-cases" className="scroll-mt-24">
        <UseCaseSelector />
      </section>

      {/* SECTION 2: INTERACTIVE ESCROW FLOW SIMULATOR */}
      <section id="ai-simulator" className="scroll-mt-24">
        <EscrowSimulator />
      </section>

      {/* FEATURE PILLARS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3.5 border-cyan-500/20">
          <div className="w-11 h-11 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-inner">
            <Lock className="w-5.5 h-5.5" />
          </div>
          <h3 className="text-lg font-bold text-white">{t('pillar1Title')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t('pillar1Desc')}</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3.5 border-cyan-500/20">
          <div className="w-11 h-11 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-inner">
            <Sparkles className="w-5.5 h-5.5" />
          </div>
          <h3 className="text-lg font-bold text-white">{t('pillar2Title')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t('pillar2Desc')}</p>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-3.5 border-cyan-500/20">
          <div className="w-11 h-11 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-inner">
            <Send className="w-5.5 h-5.5" />
          </div>
          <h3 className="text-lg font-bold text-white">{t('pillar3Title')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t('pillar3Desc')}</p>
        </div>
      </section>

      {/* 🦀 Why Arbitrum Stylus (Rust WASM) vs Solidity Section */}
      <section className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border-cyan-500/30">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('whyStylusBadge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('whyStylusTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            {t('whyStylusSub')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-[#030818] p-5 rounded-xl border border-cyan-500/40 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>{t('stylusPoint0Title')}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('stylusPoint0Desc')}
            </p>
          </div>

          <div className="bg-[#030818] p-5 rounded-xl border border-cyan-900/40 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>{t('stylusPoint1Title')}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('stylusPoint1Desc')}
            </p>
          </div>

          <div className="bg-[#030818] p-5 rounded-xl border border-cyan-900/40 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>{t('stylusPoint2Title')}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('stylusPoint2Desc')}
            </p>
          </div>

          <div className="bg-[#030818] p-5 rounded-xl border border-cyan-900/40 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{t('stylusPoint3Title')}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('stylusPoint3Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* 🗺️ Roadmap 2026: Progressive Decentralization Section */}
      <section className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border-cyan-500/30">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('roadmapBadge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('roadmapTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            {t('roadmapSub')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="bg-[#030818] p-5 rounded-xl border border-cyan-500/40 space-y-2.5 relative">
            <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full inline-block mb-1">
              PROD LIVE
            </span>
            <h4 className="text-sm font-bold text-white">{t('phase1Title')}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('phase1Desc')}
            </p>
          </div>

          <div className="bg-[#030818] p-5 rounded-xl border border-cyan-900/40 space-y-2.5">
            <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full inline-block mb-1">
              FASE 2
            </span>
            <h4 className="text-sm font-bold text-white">{t('phase2Title')}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('phase2Desc')}
            </p>
          </div>

          <div className="bg-[#030818] p-5 rounded-xl border border-cyan-900/40 space-y-2.5">
            <span className="text-[10px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800 px-2 py-0.5 rounded-full inline-block mb-1">
              FASE 3
            </span>
            <h4 className="text-sm font-bold text-white">{t('phase3Title')}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('phase3Desc')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}



