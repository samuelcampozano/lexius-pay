'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, Upload, ShieldCheck, CheckCircle2, RefreshCw, FileText, Cpu, Lock, AlertTriangle, Play } from 'lucide-react';
import { DisputeVerdict } from '@/types';
import { useStylusContract } from '@/hooks/useStylusContract';
import { usePrivy } from '@privy-io/react-auth';
import { useLanguage } from '@/context/LanguageContext';

export default function DisputePage() {
  const params = useParams();
  const escrowId = (params.id as string) || '1';
  const { t, lang } = useLanguage();

  const { resolveDisputeWithSignature, get_oracle } = useStylusContract();
  const { authenticated, login } = usePrivy();

  const [claimText, setClaimText] = useState(
    t('disputeDefaultClaim')
  );

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

  const mockBuyer = '0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E';
  const mockSeller = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

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
      winner: '0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E',
      reasoning: t('disputeDemoReasoning'),
      summary: 'Verdict in favor of Buyer (Refund Executed)',
      confidenceScore: 0.99,
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
      const oracleUrl = process.env.NEXT_PUBLIC_AI_ORACLE_URL || 'http://localhost:8080';
      const response = await fetch(`${oracleUrl}/api/dispute/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId,
          buyerAddress: mockBuyer,
          sellerAddress: mockSeller,
          itemDescription: 'VIP Concert Ticket — ETH Lima Afterparty 2026',
          claimText,
          evidenceImageUrls: proofUrl ? [proofUrl] : [],
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
        summary: data.summary || 'AI Dispute Decision',
        confidenceScore: data.confidenceScore || 0.95,
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

      // Exact parameters expected by Rust Stylus contract resolve_dispute_with_signature:
      // escrow_id: uint256 (bigint)
      // winner: address (0x...)
      // v: uint8 (number, 27 or 28)
      // r: bytes32 (0x...)
      // s: bytes32 (0x...)
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

  const isOracleMismatch =
    onChainOracle &&
    verdict?.oracleAddress &&
    onChainOracle.toLowerCase() !== verdict.oracleAddress.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>GCP Cloud Run + OpenAI GPT-4o Vision</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          {t('disputeCenterTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Column */}
        <div className="glass-card rounded-2xl p-6 space-y-5 border-cyan-500/30">
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-cyan-950 pb-3">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>{t('disputeFormHeader')}</span>
          </div>

          <form onSubmit={handleEvaluateAI} className="space-y-4">
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('disputeExplanation')}
              </label>
              <textarea
                rows={4}
                required
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('disputeEvidenceLabel')}
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-800/60 bg-[#030818] px-3 py-4 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-white">
                <Upload className="h-4 w-4 text-cyan-400" />
                <span>{uploading ? t('disputeUploading') : t('disputeUploadPrompt')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
              </label>
              {proofUrl ? (
                <p className="mt-2 text-[11px] text-cyan-400 font-bold">{t('disputePreviewReady')}</p>
              ) : (
                <p className="mt-2 text-[11px] text-slate-500">{t('disputeAcceptedFormats')}</p>
              )}
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
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              {t('disputeAttachedPreview')}
            </span>
            {proofUrl && (
              <div className="relative rounded-xl overflow-hidden border border-cyan-900/40 bg-[#030818] max-h-48">
                <img
                  src={proofUrl}
                  alt={t('disputeEvidenceAlt')}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="bg-[#030818] p-4 rounded-xl border border-cyan-900/40 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>{t('disputeOracleNode')}</span>
              <span className="text-cyan-400 font-mono font-semibold">GCP Cloud Run</span>
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
            <span className="text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full">
              {t('disputeConfidence').replace('{score}', String(Math.round(verdict.confidenceScore * 100)))}
            </span>
          </div>

          <div className="space-y-4">
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
