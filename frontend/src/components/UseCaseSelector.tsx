'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Briefcase,
  Users,
  AlertTriangle,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function UseCaseSelector() {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'commerce' | 'freelance' | 'otc'>('commerce');

  const useCases = {
    commerce: {
      id: 'commerce',
      icon: ShoppingBag,
      title: lang === 'es' ? 'Social Commerce' : 'Social Commerce',
      subtitle: lang === 'es' ? 'Instagram & Facebook Marketplace' : 'Instagram & Facebook Marketplace',
      badge: lang === 'es' ? 'Vendedores y Compradores' : 'Sellers & Buyers',
      color: 'blue',
      pain:
        lang === 'es'
          ? 'El Dilema de la Confianza P2P. El comprador teme realizar una transferencia bancaria previa por riesgo de ser bloqueado o estafado. El vendedor no desea despachar el producto sin garantía de pago previa.'
          : 'The P2P Trust Dilemma. The buyer hesitates to wire funds upfront for fear of being ghosted or scammed. The seller refuses to ship merchandise without upfront payment confirmation.',
      shield:
        lang === 'es'
          ? 'El vendedor genera un enlace de Lexius Pay en 10s. El comprador congela sus USDC en el contrato inteligente Arbitrum Stylus. El vendedor realiza el envío con la tranquilidad total de que el dinero está asegurado on-chain.'
          : 'The seller generates a Lexius Pay link in 10s. The buyer locks USDC in the Arbitrum Stylus smart contract. The seller ships with complete peace of mind knowing funds are secured on-chain.',
      metrics: [
        { label: lang === 'es' ? 'Creación de Enlace' : 'Link Creation', value: '< 10s', icon: Clock },
        { label: lang === 'es' ? 'Costo de Gas' : 'Gas Fee', value: '~$0.01', icon: Coins },
        { label: lang === 'es' ? 'Tiempo de Resolución' : 'Resolution Time', value: '< 2 min', icon: Zap },
      ],
    },
    freelance: {
      id: 'freelance',
      icon: Briefcase,
      title: lang === 'es' ? 'Entregables Freelance' : 'Freelance Deliverables',
      subtitle: lang === 'es' ? 'Gigs en Telegram y WhatsApp' : 'Telegram & WhatsApp Gigs',
      badge: lang === 'es' ? 'Freelancers y Clientes' : 'Freelancers & Clients',
      color: 'purple',
      pain:
        lang === 'es'
          ? 'El Rehen de Entregables. Un diseñador o desarrollador entrega los archivos finales del proyecto, pero el cliente desaparece sin pagar. O el cliente paga por adelantado y el freelancer no entrega el trabajo.'
          : 'Deliverable Hostage. A designer or developer sends over the final asset files, but the client vanishes without paying. Or the client pays upfront and the freelancer fails to deliver.',
      shield:
        lang === 'es'
          ? 'El freelancer crea un acuerdo de custodia. El cliente deposita la recompensa en USDC. Al entregar los archivos finales (o vista previa con marca de agua), el cliente aprueba la liberación o el Árbitro IA resuelve la disputa.'
          : 'The freelancer creates an escrow agreement. The client deposits the USDC bounty. Once assets are uploaded, the client releases funds or the AI Mediator objectively evaluates the work if a dispute is opened.',
      metrics: [
        { label: lang === 'es' ? 'Seguridad On-Chain' : 'On-Chain Security', value: '100%', icon: ShieldCheck },
        { label: lang === 'es' ? 'Revisión IA OCR' : 'AI Vision Review', value: '< 30s', icon: Zap },
        { label: lang === 'es' ? 'Comisión Extra' : 'Extra Platform Fee', value: '0%', icon: Coins },
      ],
    },
    otc: {
      id: 'otc',
      icon: Users,
      title: lang === 'es' ? 'Social OTC & Group Buys' : 'Social OTC & Group Buys',
      subtitle: lang === 'es' ? 'Grupos Telegram Alpha & Compras en Bloque' : 'Telegram Alpha Groups & Bulk Merchandise',
      badge: lang === 'es' ? 'Comunidades Alpha' : 'Alpha Communities',
      color: 'emerald',
      pain:
        lang === 'es'
          ? 'Riesgo de Contraparte Comunitaria. Transferir dinero a administradores anónimos en Telegram para compras masivas o swaps OTC exige una confianza a ciegas vulnerable a salidas deshonestas.'
          : 'Community Counterparty Risk. Wiring funds to anonymous admins in Telegram groups for bulk merch or OTC swaps requires blind trust vulnerable to exit scams.',
      shield:
        lang === 'es'
          ? 'Los fondos se custodian en el contrato Arbitrum Stylus WASM con firmas múltiples y el Oráculo IA actúa como resguardo programático para la distribución equitativa de los activos.'
          : 'Funds are aggregated in the multi-sig compatible Arbitrum Stylus contract, with the AI Mediator acting as the programmatic safeguard for transparent bulk distribution.',
      metrics: [
        { label: lang === 'es' ? 'Motor de Contrato' : 'Contract Engine', value: 'Stylus WASM', icon: ShieldCheck },
        { label: lang === 'es' ? 'Compatibilidad' : 'Compatibility', value: 'Multi-Sig', icon: Users },
        { label: lang === 'es' ? 'Firma de Seguridad' : 'Security Signer', value: 'ECDSA GCP', icon: Zap },
      ],
    },
  };

  const current = useCases[activeTab];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" />
          <span>{lang === 'es' ? 'Casos de Uso de la Vida Real' : 'Real-World Use Cases'}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          {lang === 'es' ? '¿Qué Problemas Resuelve Lexius Pay?' : 'What Problems Does Lexius Pay Solve?'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          {lang === 'es'
            ? 'Eliminamos la desconfianza en transacciones peer-to-peer en redes sociales mediante custodia criptográfica WASM y mediación por IA.'
            : 'We eliminate P2P friction on social networks using WASM smart contracts and autonomous AI dispute resolution.'}
        </p>
      </div>

      {/* Tabs Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['commerce', 'freelance', 'otc'] as const).map((key) => {
          const uc = useCases[key];
          const Icon = uc.icon;
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3.5 ${
                isActive
                  ? 'bg-slate-900 border-blue-500/60 shadow-lg shadow-blue-500/10 scale-[1.02]'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div
                className={`p-3 rounded-xl ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-800/60 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">{uc.title}</span>
                <span className="text-[11px] text-slate-400 block truncate">{uc.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tab Detailed View */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border-blue-500/30 glow-blue animate-in fade-in duration-300">
        {/* Top Title & Target Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <current.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{current.title}</h3>
              <p className="text-xs text-slate-400">{current.subtitle}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-full">
            👤 {current.badge}
          </span>
        </div>

        {/* Two-Column Comparison: Pain Point vs Lexius Shield */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pain Point Column */}
          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>{lang === 'es' ? 'El Problema Actual' : 'The Pain Point'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {current.pain}
            </p>
          </div>

          {/* Lexius Shield Column */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'es' ? 'La Solución Lexius Pay' : 'The Lexius Shield'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {current.shield}
            </p>
          </div>
        </div>

        {/* Metrics Callout Strip */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {current.metrics.map((m, idx) => {
            const MIcon = m.icon;
            return (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-center space-y-1"
              >
                <div className="flex justify-center text-blue-400 mb-1">
                  <MIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  {m.label}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono block">
                  {m.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
