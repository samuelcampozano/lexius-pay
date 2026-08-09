'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  Lock,
  Sparkles,
  RefreshCw,
  Fingerprint,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Terminal,
  FileText,
  Upload,
  Cpu,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function EscrowSimulator() {
  const { lang } = useLanguage();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [sellerHandle, setSellerHandle] = useState('Samuel (0x71C765...8976F)');
  const [price, setPrice] = useState(50);
  const [agreementDetails, setAgreementDetails] = useState(
    lang === 'es'
      ? 'Casaca vintage en perfecto estado — Talla M'
      : 'Vintage leather jacket in mint condition — Size M'
  );

  // Step 2 Passkey state
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricMessage, setBiometricMessage] = useState('');

  // Step 4/5 Path
  const [selectedPath, setSelectedPath] = useState<'happy' | 'dispute' | null>(null);

  // Terminal log animation lines for dispute
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [resolvingAi, setResolvingAi] = useState(false);

  const handleStartAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePayPasskey = () => {
    setBiometricLoading(true);
    setBiometricMessage(
      lang === 'es' ? 'Privy: Creando Embedded Wallet...' : 'Privy: Creating Embedded Wallet...'
    );

    setTimeout(() => {
      setBiometricMessage(
        lang === 'es'
          ? 'Firmando transacción on-chain en Arbitrum Sepolia...'
          : 'Signing on-chain transaction on Arbitrum Sepolia...'
      );
    }, 1200);

    setTimeout(() => {
      setBiometricLoading(false);
      setStep(3);
    }, 2400);
  };

  const handleSelectPath = (path: 'happy' | 'dispute') => {
    setSelectedPath(path);
    setStep(5);

    if (path === 'dispute') {
      setResolvingAi(true);
      setTerminalLogs([]);

      const logs = [
        '[GCS] Uploading chat evidence to gs://lexius-dispute-evidence/1042_proof.png...',
        '[GCP Cloud Run] Spinning up container (us-central1)...',
        '[AI Mediator] Analyzing screenshots using OpenAI GPT-4o Vision OCR...',
        '[Signer] Compiling JSON verdict and generating ECDSA signature (v=27, r, s)...',
        '[Arbitrum Stylus] Verifying signature against oracle_address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266...',
        '[Arbitrum Stylus] Signature verified successfully. Payout dispatched to Winner!',
      ];

      logs.forEach((logLine, index) => {
        setTimeout(() => {
          setTerminalLogs((prev) => [...prev, logLine]);
          if (index === logs.length - 1) {
            setResolvingAi(false);
          }
        }, (index + 1) * 600);
      });
    }
  };

  const resetSimulator = () => {
    setStep(1);
    setSelectedPath(null);
    setTerminalLogs([]);
    setResolvingAi(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'es' ? 'Simulador en Vivo' : 'Live Interactive Playground'}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          {lang === 'es'
            ? 'Prueba la Experiencia de Escrow de Principio a Fin'
            : 'Test the End-to-End Escrow Experience'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          {lang === 'es'
            ? 'Interactúa con el flujo paso a paso: desde el acuerdo inicial hasta la custodia en Arbitrum Stylus y la resolución con GPT-4o Vision.'
            : 'Click through the step-by-step wizard: from agreement creation to WASM custody and AI resolution.'}
        </p>
      </div>

      {/* Progress Wizard Indicator */}
      <div className="glass-card rounded-2xl p-4 flex justify-between items-center max-w-2xl mx-auto border-cyan-950/80 text-xs shadow-xl">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold font-mono transition-all ${
                step === s
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/40 scale-110'
                  : step > s
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40'
                  : 'bg-[#030818] text-slate-600 border border-slate-800'
              }`}
            >
              {step > s ? '✓' : s}
            </div>
            <span
              className={`hidden md:inline text-[11px] font-medium ${
                step === s ? 'text-cyan-300 font-bold' : 'text-slate-500'
              }`}
            >
              {s === 1 && (lang === 'es' ? 'Acuerdo' : 'Agreement')}
              {s === 2 && (lang === 'es' ? 'Depósito' : 'Deposit')}
              {s === 3 && (lang === 'es' ? 'Bóveda WASM' : 'WASM Vault')}
              {s === 4 && (lang === 'es' ? 'Decisión' : 'Choice')}
              {s === 5 && (lang === 'es' ? 'Veredicto' : 'Verdict')}
            </span>
            {s < 5 && <span className="text-slate-700 hidden sm:inline">→</span>}
          </div>
        ))}
      </div>

      {/* STEP 1: AGREEMENT FORM */}
      {step === 1 && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 max-w-xl mx-auto border-cyan-500/30 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-cyan-950/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-950/80 text-cyan-400 rounded-xl border border-cyan-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {lang === 'es' ? 'Paso 1: Configurar Acuerdo' : 'Step 1: Set Agreement Terms'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'es' ? 'Simula la creación del enlace' : 'Simulate link creation'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-bold">
              Paso 1 de 5
            </span>
          </div>

          <form onSubmit={handleStartAgreement} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Vendedor' : 'Seller Address / Handle'}
              </label>
              <input
                type="text"
                value={sellerHandle}
                onChange={(e) => setSellerHandle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {lang === 'es' ? 'Precio (USDC)' : 'Price (USDC)'}
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {lang === 'es' ? 'Red' : 'Network'}
                </label>
                <div className="w-full px-3.5 py-2.5 bg-[#060e28] border border-cyan-900/40 rounded-xl text-cyan-300 font-mono text-xs flex items-center gap-2 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  Arbitrum Sepolia
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'es' ? 'Detalle del Acuerdo' : 'Agreement Details'}
              </label>
              <textarea
                rows={2}
                value={agreementDetails}
                onChange={(e) => setAgreementDetails(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>
                {lang === 'es'
                  ? 'Generar Enlace de Pago Segurizado'
                  : 'Generate Secured Payment Link'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: BUYER DEPOSIT SIMULATION */}
      {step === 2 && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 max-w-xl mx-auto border-cyan-500/30 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-cyan-950/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-950/80 text-cyan-400 rounded-xl border border-cyan-500/30">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {lang === 'es' ? 'Paso 2: Depósito con Passkey' : 'Step 2: Passkey Deposit'}
                </h3>
                <p className="text-xs text-slate-400">Privy Embedded Wallet</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-bold">
              Paso 2 de 5
            </span>
          </div>

          <div className="bg-[#030818] p-4 rounded-xl border border-cyan-900/40 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">{lang === 'es' ? 'Vendedor:' : 'Seller:'}</span>
              <span className="text-white font-mono font-medium">{sellerHandle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">{lang === 'es' ? 'Monto:' : 'Amount:'}</span>
              <span className="text-cyan-400 font-mono font-bold text-sm">{price} USDC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">{lang === 'es' ? 'Comprador (Mock):' : 'Buyer (Mock):'}</span>
              <span className="text-emerald-400 font-mono">0x33f...c7ac</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handlePayPasskey}
              disabled={biometricLoading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {biometricLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-mono">{biometricMessage}</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5 text-cyan-200" />
                  <span>
                    {lang === 'es'
                      ? 'Pagar con Passkey (FaceID / Google)'
                      : 'Pay with Passkey (FaceID / Google)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOCKED CUSTODIA (ARBITRUM STYLUS ESCROW) */}
      {step === 3 && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 max-w-xl mx-auto border-cyan-500/40 glow-cyan animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-cyan-950/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-950/80 text-cyan-400 rounded-xl border border-cyan-500/30">
                <Lock className="w-6 h-6 animate-pulse text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {lang === 'es' ? 'Paso 3: Fondos Bloqueados en Bóveda Stylus' : 'Step 3: Funds Locked in Stylus Vault'}
                </h3>
                <p className="text-xs text-slate-400">Arbitrum Stylus Rust WASM</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full uppercase font-bold">
              locked_in_escrow
            </span>
          </div>

          <div className="bg-[#030818] p-5 rounded-xl border border-cyan-900/40 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Escrow ID:</span>
              <span className="font-mono text-cyan-400 font-bold">#1042</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{lang === 'es' ? 'Fondos en Custodia:' : 'Custody Funds:'}</span>
              <span className="font-mono text-cyan-300 font-extrabold text-lg">{price}.00 USDC</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-cyan-950">
              <span>USDC Contract Address:</span>
              <a
                href="https://sepolia.arbiscan.io/address/0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>0x75fa...AA4d</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <button
            onClick={() => setStep(4)}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>
              {lang === 'es' ? 'Continuar a Selección de Caso' : 'Proceed to Scenario Selection'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 4: CHOOSE YOUR ADVENTURE (HAPPY PATH VS DISPUTE) */}
      {step === 4 && (
        <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-3 py-1 rounded-full uppercase font-bold">
              Paso 4 de 5: Elige tu Camino
            </span>
            <h3 className="text-2xl font-bold text-white">
              {lang === 'es' ? '¿Cómo Quieres Resolver la Transacción?' : 'How Do You Want to Resolve the Escrow?'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'es'
                ? 'Simula una entrega exitosa o activa el Oráculo IA en caso de conflicto.'
                : 'Simulate a successful delivery or trigger the AI Oracle for conflict resolution.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Happy Path Card */}
            <button
              onClick={() => handleSelectPath('happy')}
              className="glass-card glass-card-hover rounded-2xl p-6 text-left space-y-4 border-cyan-500/30 hover:border-cyan-400 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-lg">
                  {lang === 'es' ? 'Vía de Éxito (Happy Path)' : 'Success Path (Happy Flow)'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'es'
                    ? 'El comprador recibe la casaca en perfecto estado y presiona "Liberar Fondos". Los USDC se transfieren instantáneamente a la billetera del vendedor.'
                    : 'The buyer receives the product as described and clicks "Release Funds". USDC is transferred immediately to the seller.'}
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1 text-xs font-bold text-cyan-400">
                <span>{lang === 'es' ? 'Simular Liberación Directa' : 'Simulate Direct Release'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Dispute Path Card */}
            <button
              onClick={() => handleSelectPath('dispute')}
              className="glass-card glass-card-hover rounded-2xl p-6 text-left space-y-4 border-cyan-500/30 hover:border-cyan-400 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-lg">
                  {lang === 'es' ? 'Vía de Conflicto (AI Dispute)' : 'Dispute Path (AI Mediation)'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'es'
                    ? 'El comprador afirma que el vendedor nunca envió el paquete. El comprador sube captura de chat y activa el Oráculo GPT-4o Vision en GCP.'
                    : 'The buyer claims the seller ghosted them and never shipped. Buyer uploads chat proof and triggers GPT-4o Vision on GCP.'}
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1 text-xs font-bold text-cyan-400">
                <span>{lang === 'es' ? 'Simular Árbitro IA GCP' : 'Simulate GCP AI Oracle'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: RESOLUTION ENGINE */}
      {step === 5 && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
          {selectedPath === 'happy' ? (
            /* Happy Path Result */
            <div className="glass-card rounded-2xl p-8 text-center space-y-5 border-cyan-500/40 glow-cyan">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30 shadow-lg">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  {lang === 'es' ? '¡Escrow Liberado con Éxito!' : 'Escrow Released Successfully!'}
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  {lang === 'es'
                    ? `Los 50.00 USDC se han transferido a la billetera del vendedor (${sellerHandle}) en Arbitrum Sepolia.`
                    : `50.00 USDC transferred to seller wallet (${sellerHandle}) on Arbitrum Sepolia.`}
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={resetSimulator}
                  className="px-6 py-3 bg-[#070e24] hover:bg-[#0b173c] text-white text-xs font-bold rounded-xl border border-cyan-900/40 transition"
                >
                  🔄 {lang === 'es' ? 'Reiniciar Simulador' : 'Reset Simulator'}
                </button>
              </div>
            </div>
          ) : (
            /* Dispute Path Terminal Execution */
            <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border-cyan-500/40 glow-cyan">
              <div className="flex items-center justify-between border-b border-cyan-950/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-950/80 text-cyan-400 rounded-xl border border-cyan-500/30">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {lang === 'es' ? 'Pipeline Oráculo IA en Ejecución' : 'AI Oracle Execution Pipeline'}
                    </h3>
                    <p className="text-[11px] text-slate-400">GCP Cloud Run + OpenAI GPT-4o Vision</p>
                  </div>
                </div>
                {resolvingAi ? (
                  <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-500/30 font-bold">
                    Verdict Executed
                  </span>
                )}
              </div>

              {/* Live Terminal Log Stream */}
              <div className="bg-[#020612] p-4 rounded-xl border border-cyan-950 font-mono text-xs space-y-2 text-cyan-300 min-h-[160px]">
                {terminalLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0">›</span>
                    <span className={i === terminalLogs.length - 1 ? 'text-cyan-200 font-bold' : ''}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>

              {/* JSON Verdict Render */}
              {!resolvingAi && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    {lang === 'es' ? 'Veredicto Final en Formato JSON (Firma ECDSA)' : 'Final Verdict JSON (ECDSA Signed)'}
                  </span>
                  <pre className="bg-[#020612] p-4 rounded-xl border border-cyan-500/30 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    winner: '0x33f...c7ac (Comprador)',
    reason:
      lang === 'es'
        ? 'La evidencia de chat demuestra que el vendedor no envió el código de seguimiento después de 72 horas y dejó de responder los mensajes. Reembolso concedido al Comprador.'
        : 'Chat OCR evidence confirms seller failed to provide shipping tracking after 72 hours and stopped responding. Refund granted to Buyer.',
    oracleAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    signature:
      '0x9f6e04f166a533fb30945a7d28acdcdd8e0a225087ed642650051ff1da266b7b340b0e51816b3b476b30f1b7c561758efbbbb75bd4240ba342cc2519d9b1e7bb1b',
  },
  null,
  2
)}
                  </pre>

                  <div className="pt-2 text-center">
                    <button
                      onClick={resetSimulator}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition"
                    >
                      🔄 {lang === 'es' ? 'Probar Otra Simulación' : 'Run Another Simulation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

