'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Cpu,
  ShieldCheck,
  Key,
  Lock,
  Sparkles,
  Search,
  BookOpen,
  ArrowUpRight,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface GlossaryItem {
  id: string;
  term: string;
  badge: string;
  icon: any;
  simpleDef: { es: string; en: string };
  lexiusContext: { es: string; en: string };
}

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    id: 'wasm',
    term: 'WebAssembly (WASM) & Arbitrum Stylus',
    badge: 'Motor de Ejecución Ultra Rápido',
    icon: Cpu,
    simpleDef: {
      es: 'WebAssembly (WASM) es una tecnología que permite ejecutar código compilado súper rápido directamente en navegadores y contratos inteligentes de blockchain.',
      en: 'WebAssembly (WASM) is a technology that executes high-performance compiled code directly inside web browsers and blockchain smart contracts.',
    },
    lexiusContext: {
      es: 'En Lexius Pay, los contratos inteligentes no se escriben en Solidity tradicional, sino en Rust compilado a WASM sobre Arbitrum Stylus. Esto permite procesar pagos y custodias en milisegundos con comisiones menores a $0.01 USDC.',
      en: 'In Lexius Pay, smart contracts are written in Rust compiled to WASM on Arbitrum Stylus. This processes payments and escrows in milliseconds with gas fees under $0.01 USDC.',
    },
  },
  {
    id: 'ai-oracle',
    term: 'Oráculo de IA (GPT-4o Vision en GCP)',
    badge: 'Árbitro Imparcial Multimodal',
    icon: Sparkles,
    simpleDef: {
      es: 'Un Oráculo en Web3 es un puente de datos entre el mundo real y la blockchain. Nuestro oráculo integra GPT-4o Vision alojado en Google Cloud Run.',
      en: 'A Web3 Oracle is a data bridge connecting real-world evidence to the blockchain. Our oracle runs GPT-4o Vision hosted on Google Cloud Run.',
    },
    lexiusContext: {
      es: 'Si surge un conflicto entre comprador y vendedor, el Oráculo de IA analiza fotos de comprobantes, recibos y conversaciones de chat en segundos para determinar objetivamente quién tiene la razón.',
      en: 'When a dispute arises between buyer and seller, the AI Oracle reads receipt photos, screenshots, and chat logs in seconds to objectively evaluate who is right.',
    },
  },
  {
    id: 'ecdsa',
    term: 'Firma Criptográfica ECDSA',
    badge: 'Sello Matemático Anti-Inalterable',
    icon: ShieldCheck,
    simpleDef: {
      es: 'ECDSA (Elliptic Curve Digital Signature Algorithm) es una firma digital matemática imposible de falsificar o alterar.',
      en: 'ECDSA (Elliptic Curve Digital Signature Algorithm) is an unforgeable mathematical cryptographic signature.',
    },
    lexiusContext: {
      es: 'Cuando la IA emite un fallo, sella su veredicto con una clave secreta en GCP. El contrato WASM en Arbitrum verifica esta firma antes de entregar el dinero al ganador, garantizando que nadie pueda alterar la decisión.',
      en: 'When the AI reaches a verdict, it signs it with a cryptographic key stored in GCP. The WASM contract verifies this signature before releasing funds, ensuring zero tampering.',
    },
  },
  {
    id: 'escrow',
    term: 'Escrow (Bóveda de Custodia Neutral)',
    badge: 'Protección Bilateral de Fondos',
    icon: Lock,
    simpleDef: {
      es: 'Un servicio de custodia que congela los fondos de un comprador en un lugar seguro hasta que se confirma la entrega satisfactoria del producto o servicio.',
      en: 'A neutral holding service that locks buyer funds in a safe vault until satisfactory delivery of the item or service is verified.',
    },
    lexiusContext: {
      es: 'Ningún humano o administrador de Lexius tiene acceso a tu dinero. Tus USDC permanecen bloqueados en la bóveda transparente de Stylus y solo se liberan mediante la confirmación del comprador o el fallo del árbitro IA.',
      en: 'No human or Lexius admin ever controls your money. Your USDC stays locked in Stylus WASM smart contracts until either buyer approval or an AI verdict releases it.',
    },
  },
  {
    id: 'passkey',
    term: 'Passkeys / Embedded Wallets (Privy)',
    badge: 'Acceso Web2.5 Sin Frases Semilla',
    icon: Key,
    simpleDef: {
      es: 'Una billetera cripto integrada que te permite interactuar con Web3 usando tu cuenta de Google, correo o autenticación biométrica (FaceID/TouchID).',
      en: 'An embedded crypto wallet that lets you interact with Web3 using your Google account, email, or biometric passkeys (FaceID/TouchID).',
    },
    lexiusContext: {
      es: 'En Lexius Pay no necesitas memorizar 12 palabras ni instalar extensiones complejas. Puedes realizar pagos y gestionar acuerdos inmediatamente con la simplicidad de una app moderna.',
      en: 'In Lexius Pay, you never need to write down 12-word seed phrases. You can complete escrows and approve transactions seamlessly with Google or TouchID.',
    },
  },
  {
    id: 'usdc',
    term: 'USDC (Dólar Digital Estable)',
    badge: 'Moneda de Pago $1.00 USD',
    icon: Coins,
    simpleDef: {
      es: 'Una moneda digital respaldada 1 a 1 por dólares estadounidenses en reservas bancarias auditadas.',
      en: 'A digital dollar stablecoin backed 1:1 by liquid U.S. dollar reserves in audited bank accounts.',
    },
    lexiusContext: {
      es: 'Lexius Pay utiliza USDC en Arbitrum Sepolia para que tus acuerdos tengan valor fijo en dólares, evitando la volatilidad de precios de otras criptomonedas.',
      en: 'Lexius Pay uses USDC on Arbitrum Sepolia so your payment agreements maintain fixed 1:1 dollar value without price volatility.',
    },
  },
];

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlossaryModal({ isOpen, onClose }: GlossaryModalProps) {
  const { lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string>('wasm');

  if (!isOpen) return null;

  const filteredItems = GLOSSARY_ITEMS.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.simpleDef[lang].toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lexiusContext[lang].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeItem =
    GLOSSARY_ITEMS.find((item) => item.id === selectedId) || GLOSSARY_ITEMS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#060c21] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-950/80 bg-[#040814]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>
                  {lang === 'es'
                    ? '¿Nuevo en Lexius Pay? Glosario de Conceptos'
                    : 'New to Lexius Pay? Concept Glossary'}
                </span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                  {lang === 'es' ? 'Guía Fácil' : 'Easy Guide'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'es'
                  ? 'Explicación sencilla de la tecnología Web3, WASM e IA detrás de Lexius'
                  : 'Plain-language explanations of Web3, WASM, and AI behind Lexius'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-cyan-950/60 bg-[#040814]/50 flex items-center gap-3">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder={
              lang === 'es'
                ? 'Buscar concepto (ej. WASM, Oráculo, Firma, Escrow)...'
                : 'Search concept (e.g., WASM, Oracle, Signature, Escrow)...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Left Column: Concept Tabs */}
          <div className="border-r border-cyan-950/80 p-3 space-y-1.5 overflow-y-auto max-h-[50vh] md:max-h-full bg-[#030818]">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isSelected = item.id === activeItem.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/60 border-cyan-500/40 text-cyan-200 shadow-md'
                      : 'border-transparent text-slate-400 hover:bg-[#070e24] hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold block truncate text-white">
                      {item.term}
                    </span>
                    <span className="text-[10px] text-cyan-400/80 font-mono block truncate">
                      {item.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Explanation & Lexius Context */}
          <div className="col-span-2 p-6 overflow-y-auto space-y-6 bg-[#060c21] max-h-[55vh] md:max-h-full">
            {/* Term Title Banner */}
            <div className="flex items-start justify-between border-b border-cyan-950 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold">
                  <span>{activeItem.badge}</span>
                </div>
                <h4 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>{activeItem.term}</span>
                </h4>
              </div>
            </div>

            {/* Simple Definition Box */}
            <div className="bg-[#030818] p-4 rounded-xl border border-cyan-900/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>
                  {lang === 'es'
                    ? '1. Explicación Sencilla (¿Qué es?)'
                    : '1. Simple Definition (What is it?)'}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {activeItem.simpleDef[lang]}
              </p>
            </div>

            {/* Lexius Context Box */}
            <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 p-4 rounded-xl border border-cyan-500/30 space-y-2 glow-cyan">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>
                  {lang === 'es'
                    ? '2. ¿Cómo se Aplica en Lexius Pay?'
                    : '2. How it works in Lexius Pay'}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {activeItem.lexiusContext[lang]}
              </p>
            </div>

            {/* Architectural Hint */}
            <div className="p-3 bg-[#020612] rounded-xl border border-cyan-950 font-mono text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                {lang === 'es'
                  ? 'Garantizado por Arbitrum Stylus (Rust WASM) & GCP Cloud Run'
                  : 'Secured by Arbitrum Stylus (Rust WASM) & GCP Cloud Run'}
              </span>
              <span className="text-cyan-400 font-bold">100% On-Chain</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-cyan-950 bg-[#040814] flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            {lang === 'es'
              ? 'Lexius Pay — Sistema de Custodia y Resolución Autónomo'
              : 'Lexius Pay — Autonomous Escrow & Resolution System'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition shadow-md shadow-cyan-500/20"
          >
            {lang === 'es' ? 'Entendido / Cerrar' : 'Got it / Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
