'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, Upload, ShieldCheck, CheckCircle2, RefreshCw, FileText, Cpu, Lock, AlertTriangle, Play, ShieldAlert, Check } from 'lucide-react';
import { DisputeVerdict } from '@/types';
import { useStylusContract } from '@/hooks/useStylusContract';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { useLanguage } from '@/context/LanguageContext';
import { STYLUS_ESCROW_ADDRESS, STYLUS_ESCROW_ABI } from '@/lib/contracts';

export default function DisputePage() {
  const params = useParams();
  const escrowId = (params.id as string) || '1';
  const { t, lang } = useLanguage();

  const { resolveDisputeWithSignature, get_oracle } = useStylusContract();
  const { authenticated, login } = usePrivy();

  const [claimText, setClaimText] = useState(
    t('disputeDefaultClaim')
  );

  const [sellerClaimText, setSellerClaimText] = useState('');
  const [sellerProofUrl, setSellerProofUrl] = useState('');
  const [sellerUploading, setSellerUploading] = useState(false);

  useEffect(() => {
    setClaimText(t('disputeDefaultClaim'));
  }, [lang]);

  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [verdict, setVerdict] = useState<DisputeVerdict | null>(null);
  const [executingTx, setExecutingTx] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Oracle address check
  const [onChainOracle, setOnChainOracle] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'Buyer' | 'Seller'>('Buyer');

  const { user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = (
    wallets?.[0]?.address ||
    user?.wallet?.address ||
    ''
  ).toLowerCase();

  // Mark escrow as Disputed in localStorage, determine role on-chain, and notify Telegram
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('lexius_user_escrows') || '[]');
      let updated = false;
      const newStored = stored.map((item: any) => {
        if (item.id === escrowId && item.status !== 'Disputed' && item.status !== 'Completed') {
          updated = true;
          return { ...item, status: 'Disputed' };
        }
        return item;
      });
      if (updated) {
        localStorage.setItem('lexius_user_escrows', JSON.stringify(newStored));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('lexius_escrow_updated'));
      }

      // 1. First check local storage role
      const currentItem = stored.find((item: any) => item.id === escrowId);
      if (currentItem) {
        if (activeWallet) {
          const isSellerWallet = currentItem.seller?.toLowerCase() === activeWallet;
          const isBuyerWallet = currentItem.buyer?.toLowerCase() === activeWallet;
          if (isSellerWallet && !isBuyerWallet) setCurrentUserRole('Seller');
          else if (isBuyerWallet && !isSellerWallet) setCurrentUserRole('Buyer');
          else if (currentItem.role === 'Seller') setCurrentUserRole('Seller');
          else if (currentItem.role === 'Buyer') setCurrentUserRole('Buyer');
        } else if (currentItem.role === 'Seller' || currentItem.role === 'Buyer') {
          setCurrentUserRole(currentItem.role);
        }
      }
    } catch (e) {}

    // 2. Fetch on-chain escrow data from Arbitrum Sepolia to query exact buyer/seller addresses
    async function syncRoleFromBlockchain() {
      if (!escrowId || escrowId === 'demo') return;
      try {
        const publicClient = createPublicClient({
          chain: arbitrumSepolia,
          transport: http(process.env.NEXT_PUBLIC_STYLUS_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'),
        });
        const numericId = BigInt(escrowId.replace('#', ''));
        const escrowInfo = (await publicClient.readContract({
          address: STYLUS_ESCROW_ADDRESS,
          abi: STYLUS_ESCROW_ABI,
          functionName: 'getEscrow',
          args: [numericId],
        })) as [string, string, bigint, number, string];

        const buyerOnChain = escrowInfo[0]?.toLowerCase();
        const sellerOnChain = escrowInfo[1]?.toLowerCase();

        if (activeWallet) {
          if (activeWallet === sellerOnChain && activeWallet !== buyerOnChain) {
            setCurrentUserRole('Seller');
          } else if (activeWallet === buyerOnChain && activeWallet !== sellerOnChain) {
            setCurrentUserRole('Buyer');
          }
        }
      } catch (err) {
        console.warn('[DisputePage] Could not query on-chain role:', err);
      }
    }

    syncRoleFromBlockchain();

    // Load any existing dispute data for this escrow
    try {
      const saved = JSON.parse(localStorage.getItem(`lexius_dispute_data_${escrowId}`) || '{}');
      if (saved.claimText) setClaimText(saved.claimText);
      if (saved.proofUrl) setProofUrl(saved.proofUrl);
      if (saved.sellerClaimText) setSellerClaimText(saved.sellerClaimText);
      if (saved.sellerProofUrl) setSellerProofUrl(saved.sellerProofUrl);
      if (saved.verdict) setVerdict(saved.verdict);
    } catch (e) {}

    // Notify Telegram bot that escrow is in dispute
    try {
      const oracleUrl = process.env.NEXT_PUBLIC_AI_ORACLE_URL || 'http://localhost:8080';
      const tgContext = JSON.parse(localStorage.getItem(`lexius_tg_msg_${escrowId}`) || '{}');
      fetch(`${oracleUrl}/api/telegram/update-escrow-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: tgContext.chatId || undefined,
          messageId: tgContext.messageId ? Number(tgContext.messageId) : undefined,
          escrowId,
          newStatus: 'disputed',
        }),
      }).catch(() => {});
    } catch (e) {}
  }, [escrowId, activeWallet]);

  // Persist bilateral evidence to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(
        `lexius_dispute_data_${escrowId}`,
        JSON.stringify({
          claimText,
          proofUrl,
          sellerClaimText,
          sellerProofUrl,
          verdict,
        })
      );
    } catch (e) {}
  }, [escrowId, claimText, proofUrl, sellerClaimText, sellerProofUrl, verdict]);

  // Fetch the authorized oracle address from the Stylus contract on Sepolia
  useEffect(() => {
    async function fetchOnChainOracle() {
      try {
        const oracle = await get_oracle();
        if (oracle) {
          setOnChainOracle(oracle as string);
        }
      } catch (err) {
        console.warn('Could not fetch on-chain oracle address:', err);
      }
    }
    fetchOnChainOracle();
  }, []);

  /**
   * Load exact test data provided by Jonathan for quick E2E verification
   */
  const handleLoadMockData = () => {
    setVerdict({
      escrowId: '1',
      winner: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      reasoning: t('disputeDemoReasoning'),
      summary: 'Verdict in favor of Seller (Bilateral Protocol Applied)',
      confidenceScore: 0.96,
      fraudRiskFlag: true,
      evidenceAuthenticityScore: 0.35,
      signature: '0x9f6e04f166a533fb30945a7d28acdcdd8e0a225087ed642650051ff1da266b7b340b0e51816b3b476b30f1b7c561758efbbbb75bd4240ba342cc2519d9b1e7bb1b',
      v: 27,
      r: '0x9f6e04f166a533fb30945a7d28acdcdd8e0a225087ed642650051ff1da266b7b',
      s: '0x340b0e51816b3b476b30f1b7c561758efbbbb75bd4240ba342cc2519d9b1e7bb',
      oracleAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: new Date().toISOString(),
    });
    setTxSuccess(false);
    setTxError(null);
    setTxHash(null);
  };

  const handleEvaluateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    setVerdict(null);
    setTxError(null);

    try {
      let buyerAddr = '0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E';
      let sellerAddr = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      try {
        const stored = JSON.parse(localStorage.getItem('lexius_user_escrows') || '[]');
        const match = stored.find((item: any) => item.id === escrowId);
        if (match?.buyer) buyerAddr = match.buyer;
        if (match?.seller) sellerAddr = match.seller;
      } catch (e) {}

      const oracleUrl = process.env.NEXT_PUBLIC_AI_ORACLE_URL || 'http://localhost:8080';
      const response = await fetch(`${oracleUrl}/api/dispute/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId,
          buyerAddress: buyerAddr,
          sellerAddress: sellerAddr,
          itemDescription: 'Physical Merchandise Delivery — Olva Courier Shipment',
          claimText,
          evidenceImageUrls: proofUrl ? [proofUrl] : [],
          sellerClaimText: sellerClaimText || undefined,
          sellerEvidenceImageUrls: sellerProofUrl ? [sellerProofUrl] : [],
        }),
      });

      if (!response.ok) {
        throw new Error(`API server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setVerdict({
        escrowId: String(data.escrowId || escrowId),
        winner: data.winner,
        reasoning: data.reason || data.reasoning,
        summary: data.summary || 'Bilateral AI Dispute Decision',
        confidenceScore: data.confidenceScore || 0.95,
        fraudRiskFlag: Boolean(data.fraudRiskFlag),
        evidenceAuthenticityScore: typeof data.evidenceAuthenticityScore === 'number' ? data.evidenceAuthenticityScore : 0.85,
        signature: data.signature,
        v: Number(data.v) < 27 ? Number(data.v) + 27 : Number(data.v),
        r: data.r as `0x${string}`,
        s: data.s as `0x${string}`,
        oracleAddress: data.oracleAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        timestamp: data.timestamp || new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Backend connection failed, loading local mock data for testing:', err);
      handleLoadMockData();
    } finally {
      setEvaluating(false);
    }
  };

  /**
   * Execute the on-chain payout transaction calling Stylus `resolve_dispute_with_signature`
   */
  const handleExecuteOnChain = async () => {
    if (!verdict) return;
    setExecutingTx(true);
    setTxError(null);

    try {
      if (!authenticated) {
        await login();
        setExecutingTx(false);
        return;
      }

      const hash = await resolveDisputeWithSignature(
        BigInt(escrowId.replace('#', '')),
        verdict.winner as `0x${string}`,
        verdict.v,
        verdict.r as `0x${string}`,
        verdict.s as `0x${string}`
      );

      console.log('Dispute resolution transaction sent! Hash:', hash);
      setTxHash(hash);
      setTxSuccess(true);

      // Update escrow status to Completed in localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('lexius_user_escrows') || '[]');
        const updated = stored.map((item: any) => {
          if (item.id === escrowId) {
            return { ...item, status: 'Completed' };
          }
          return item;
        });
        localStorage.setItem('lexius_user_escrows', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('lexius_escrow_updated'));
      } catch (e) {}

      // Notify Telegram bot of completed status
      try {
        const oracleUrl = process.env.NEXT_PUBLIC_AI_ORACLE_URL || 'http://localhost:8080';
        const tgContext = JSON.parse(localStorage.getItem(`lexius_tg_msg_${escrowId}`) || '{}');
        fetch(`${oracleUrl}/api/telegram/update-escrow-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: tgContext.chatId || undefined,
            messageId: tgContext.messageId ? Number(tgContext.messageId) : undefined,
            escrowId,
            newStatus: 'completed',
          }),
        }).catch(() => {});
      } catch (e) {}
    } catch (err: any) {
      console.error('On-chain execution failed:', err);
      setTxError(err.message || 'Transaction reverted or failed');
    } finally {
      setExecutingTx(false);
    }
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const previewUrl = URL.createObjectURL(file);

    setTimeout(() => {
      setProofUrl(previewUrl);
      setUploading(false);
    }, 600);
  };

  const handleSellerReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSellerUploading(true);
    const previewUrl = URL.createObjectURL(file);

    setTimeout(() => {
      setSellerProofUrl(previewUrl);
      setSellerUploading(false);
    }, 600);
  };

  const isOracleMismatch =
    onChainOracle &&
    verdict?.oracleAddress &&
    onChainOracle.toLowerCase() !== verdict.oracleAddress.toLowerCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('disputeBilateralBadge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          {t('disputeCenterTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
          {t('disputeCenterSub')}
        </p>

        {/* Quick Mock Load Button for Testing (Demo Mode Only) */}
        {escrowId === 'demo' && (
          <div className="pt-2">
            <button
              onClick={handleLoadMockData}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#070e24] hover:bg-[#0b173c] text-cyan-300 rounded-xl text-xs font-semibold border border-cyan-900/40 transition"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('disputeDemoBtn')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Contextual Packaging Rule Notice Banner */}
      <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-start gap-3 text-xs text-cyan-200">
        <ShieldCheck className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">{t('disputePackagingRuleTitle')}</span>
          <p className="text-[11px] leading-relaxed text-cyan-300/80">
            {t('disputePackagingRuleDesc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Column: Bilateral Evidence Inputs */}
        <div className="glass-card rounded-2xl p-6 space-y-5 border-cyan-500/30">
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-cyan-950 pb-3">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>{t('disputeFormHeader')}</span>
          </div>

          <form onSubmit={handleEvaluateAI} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('disputeEscrowId')}
              </label>
              <input
                type="text"
                disabled
                value={`Escrow #${escrowId}`}
                className="w-full px-3.5 py-2.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-cyan-300 font-mono text-xs font-semibold"
              />
            </div>

            {/* Buyer Section */}
            <div className={`p-3.5 rounded-xl border space-y-3 transition-all ${
              currentUserRole === 'Buyer'
                ? 'bg-[#030818] border-cyan-500/50 shadow-md shadow-cyan-500/10'
                : 'bg-[#020614] border-cyan-950/60 opacity-90'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">
                  {t('disputeBuyerSection')}
                  {currentUserRole === 'Buyer' ? t('disputeYourSideBadge') : currentUserRole === 'Seller' ? t('disputeCounterpartySideBadge') : ''}
                </span>
                {currentUserRole === 'Seller' && (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {t('disputeBuyerOnlyLocked')}
                  </span>
                )}
              </div>

              <div>
                <textarea
                  rows={3}
                  required
                  disabled={currentUserRole === 'Seller'}
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-sans transition-all ${
                    currentUserRole === 'Seller'
                      ? 'bg-[#01030a] border-slate-900 text-slate-300 cursor-not-allowed'
                      : 'bg-[#020612] border-cyan-950 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400'
                  }`}
                />
              </div>

              <div>
                {currentUserRole === 'Seller' ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-[#01030a] px-3 py-3 text-xs text-slate-500 cursor-not-allowed">
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{t('disputeBuyerOnlyLocked')}</span>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-800/60 bg-[#020612] px-3 py-3 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-white">
                    <Upload className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{uploading ? t('disputeUploading') : t('disputeUploadPrompt')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
                  </label>
                )}
                {proofUrl && <p className="mt-1 text-[10px] text-cyan-400 font-bold">{t('disputePreviewReady')}</p>}
              </div>
            </div>

            {/* Seller Section */}
            <div className={`p-3.5 rounded-xl border space-y-3 transition-all ${
              currentUserRole === 'Seller'
                ? 'bg-[#030818] border-sky-500/50 shadow-md shadow-sky-500/10'
                : 'bg-[#020614] border-sky-950/60 opacity-90'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400">
                  {t('disputeSellerSection')}
                  {currentUserRole === 'Seller' ? t('disputeYourSideBadge') : currentUserRole === 'Buyer' ? t('disputeCounterpartySideBadge') : ''}
                </span>
                {currentUserRole === 'Buyer' && (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {t('disputeSellerOnlyLocked')}
                  </span>
                )}
              </div>

              <div>
                <textarea
                  rows={2}
                  disabled={currentUserRole === 'Buyer'}
                  placeholder={t('disputeSellerClaimPlaceholder')}
                  value={sellerClaimText}
                  onChange={(e) => setSellerClaimText(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-sans transition-all ${
                    currentUserRole === 'Buyer'
                      ? 'bg-[#01030a] border-slate-900 text-slate-300 cursor-not-allowed'
                      : 'bg-[#020612] border-cyan-950 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400'
                  }`}
                />
              </div>

              <div>
                {currentUserRole === 'Buyer' ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-900 bg-[#01030a] px-3 py-3 text-xs text-slate-500 cursor-not-allowed">
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{t('disputeSellerOnlyLocked')}</span>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-800/60 bg-[#020612] px-3 py-3 text-xs text-slate-300 transition hover:border-sky-400 hover:text-white">
                    <Upload className="h-3.5 w-3.5 text-sky-400" />
                    <span>{sellerUploading ? t('disputeUploading') : t('disputeSellerUploadPrompt')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleSellerReceiptUpload} />
                  </label>
                )}
                {sellerProofUrl && <p className="mt-1 text-[10px] text-sky-400 font-bold">{t('disputePreviewReady')}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={evaluating}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {evaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('disputeEvaluatingBtn')}</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>{t('disputeTriggerBtn')}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Evidence & Live Status Column */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border-cyan-500/30">
          <div className="space-y-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              {t('disputeAttachedPreview')}
            </span>

            <div className="grid grid-cols-1 gap-3">
              {proofUrl && (
                <div className="relative rounded-xl overflow-hidden border border-cyan-900/40 bg-[#030818] max-h-36">
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold rounded">
                    Buyer Photo
                  </span>
                  <img
                    src={proofUrl}
                    alt={t('disputeEvidenceAlt')}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {sellerProofUrl && (
                <div className="relative rounded-xl overflow-hidden border border-sky-900/40 bg-[#030818] max-h-36">
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-sky-950/90 border border-sky-500/40 text-sky-300 text-[10px] font-bold rounded">
                    Seller Dispatch Waybill
                  </span>
                  <img
                    src={sellerProofUrl}
                    alt="Seller dispatch evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {!proofUrl && !sellerProofUrl && (
                <div className="p-8 text-center border border-dashed border-cyan-900/40 rounded-xl text-slate-500 text-xs">
                  {t('disputeAcceptedFormats')}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#030818] p-4 rounded-xl border border-cyan-900/40 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>{t('disputeOracleNode')}</span>
              <span className="text-cyan-400 font-mono font-semibold">GCP Cloud Run (GPT-4o Vision)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{t('disputeOnChainOracle')}</span>
              <span className="text-cyan-300 font-mono text-[11px] truncate max-w-[150px]">
                {onChainOracle ? `${onChainOracle.slice(0, 6)}...${onChainOracle.slice(-4)}` : (lang === 'es' ? 'Cargando...' : 'Loading...')}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{t('disputeContractVerifier')}</span>
              <span className="text-cyan-400 font-mono font-semibold">Stylus ecrecover</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Verdict & Execution Modal */}
      {verdict && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border-cyan-500/40 glow-cyan animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-cyan-950 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-950/80 text-cyan-400 rounded-xl border border-cyan-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t('disputeVerdictHeader')}</h3>
                <p className="text-xs text-slate-400">{t('disputeSignedKey')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full">
                {t('disputeConfidence').replace('{score}', String(Math.round(verdict.confidenceScore * 100)))}
              </span>
              {typeof verdict.evidenceAuthenticityScore === 'number' && (
                <span className="text-xs font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full">
                  {t('disputeAuthenticityScore').replace('{score}', String(Math.round(verdict.evidenceAuthenticityScore * 100)))}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Anti-Fraud Stock Photo Risk Banner */}
            {verdict.fraudRiskFlag && (
              <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-300 text-xs">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-red-200">{t('disputeFraudAlertTitle')}</span>
                  <p className="text-[11px] leading-relaxed text-red-300/80">
                    GPT-4o Vision detectó una imagen de evidencia sin empaque, etiqueta o contexto de envío (foto de stock aislada). La afirmación del comprador carece de prueba contextual de manipulación.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-[#030818] p-4 rounded-xl border border-cyan-900/40 space-y-2">
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">{t('disputeLegalReasoning')}</span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">{verdict.reasoning}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#060e28] p-3 rounded-xl border border-cyan-900/40">
                <span className="text-slate-400 block mb-1">{t('disputeDeclaredWinner')}</span>
                <span className="font-mono text-cyan-300 font-bold truncate block">{verdict.winner}</span>
              </div>
              <div className="bg-[#060e28] p-3 rounded-xl border border-cyan-900/40">
                <span className="text-slate-400 block mb-1">{t('disputeSignerOracle')}</span>
                <span className="font-mono text-cyan-400 truncate block">{verdict.oracleAddress}</span>
              </div>
            </div>

            {/* Security Warning: Oracle Mismatch Check */}
            {isOracleMismatch && (
              <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-3 text-amber-300 text-xs">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">⚠️ Advertencia de Seguridad: Desajuste de Oráculo</span>
                  <p className="text-[11px] leading-relaxed text-amber-200/80">
                    La dirección que firmó este veredicto (<code className="bg-amber-950 px-1 py-0.5 rounded text-amber-300">{verdict.oracleAddress.slice(0, 8)}...</code>) difiere de la dirección autorizada en el contrato de Sepolia (<code className="bg-amber-950 px-1 py-0.5 rounded text-amber-300">{onChainOracle ? `${onChainOracle.slice(0, 8)}...` : 'cargando'}</code>). La transacción revertirá on-chain a menos que `set_oracle` sea actualizado en el contrato.
                  </p>
                </div>
              </div>
            )}

            {/* Cryptographic Signature Breakdown */}
            <div className="bg-[#020612] p-3 rounded-xl border border-cyan-950 font-mono text-[10px] space-y-1 text-cyan-300">
              <div className="truncate">sig: {verdict.signature}</div>
              <div className="flex gap-4 text-slate-400">
                <span>v: {verdict.v}</span>
                <span className="truncate">r: {verdict.r.slice(0, 16)}...</span>
                <span className="truncate">s: {verdict.s.slice(0, 16)}...</span>
              </div>
            </div>

            {txError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-400 text-xs font-mono">
                Error de Transacción: {txError}
              </div>
            )}
          </div>

          {!txSuccess ? (
            <button
              onClick={handleExecuteOnChain}
              disabled={executingTx}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {executingTx ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{t('disputeExecutingPayout')}</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>{t('disputeExecutePayoutBtn')}</span>
                </>
              )}
            </button>
          ) : (
            <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-cyan-400 mx-auto" />
              <h4 className="font-bold text-white">{t('disputeResolvedTitle')}</h4>
              <p className="text-xs text-slate-300">{t('disputeResolvedSub')}</p>
              {txHash && (
                <a
                  href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-mono text-cyan-400 hover:underline pt-1 font-bold"
                >
                  {t('disputeViewArbiscan')}
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
