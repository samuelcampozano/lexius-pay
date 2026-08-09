'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Cpu,
  ShieldCheck,
  Key,
  Lock,
  Sparkles,
  Coins,
  Search,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { GLOSSARY_ITEMS } from '@/components/GlossaryModal';

export default function LearnPage() {
  const { lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredItems = GLOSSARY_ITEMS.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.simpleDef[lang].toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lexiusContext[lang].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#070e24] text-slate-300 hover:text-white border border-cyan-900/40 text-xs font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'es' ? 'Volver al Inicio' : 'Back to Home'}</span>
        </Link>
        <span className="text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-bold">
          {lang === 'es' ? 'Centro de Conocimiento Lexius' : 'Lexius Knowledge Hub'}
        </span>
      </div>

      {/* Header Banner */}
      <div className="text-center space-y-4 glass-card rounded-2xl p-8 border-cyan-500/30 glow-cyan">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider shadow-inner">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'es' ? 'Guía para Nuevos Usuarios' : 'New User Guide'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          {lang === 'es'
            ? '¿Quieres Aprender Qué Significa WASM, Stylus u Oráculo IA?'
            : 'Want to Learn What WASM, Stylus & AI Oracles Mean?'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {lang === 'es'
            ? 'Te explicamos sin rodeos técnicos ni complicaciones cómo funciona la tecnología Web3, la infraestructura en Google Cloud y la custodia en Arbitrum Stylus que protegen tus pagos en Lexius Pay.'
            : 'We explain in simple, friendly terms how the Web3 technology, Google Cloud infrastructure, and Arbitrum Stylus escrow protect your payments in Lexius Pay.'}
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative pt-2">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-6" />
          <input
            type="text"
            placeholder={
              lang === 'es'
                ? 'Buscar término (ej. WASM, Oráculo, Firma, Passkey)...'
                : 'Search term (e.g. WASM, Oracle, Signature, Passkey)...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#030818] border border-cyan-900/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Grid of Glossary Cards */}
      <div className="grid grid-cols-1 gap-6">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="glass-card rounded-2xl p-6 space-y-4 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 shadow-xl"
            >
              <div className="flex items-start justify-between border-b border-cyan-950 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-950/80 text-cyan-400 rounded-xl border border-cyan-500/30">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{item.term}</h3>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Simple Definition */}
                <div className="bg-[#030818] p-4 rounded-xl border border-cyan-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4" />
                    <span>
                      {lang === 'es' ? '1. Explicación Sencilla' : '1. Simple Definition'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {item.simpleDef[lang]}
                  </p>
                </div>

                {/* 2. Lexius Pay Context */}
                <div className="bg-gradient-to-r from-cyan-950/50 to-blue-950/50 p-4 rounded-xl border border-cyan-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>
                      {lang === 'es' ? '2. En Lexius Pay' : '2. In Lexius Pay'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {item.lexiusContext[lang]}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA Card */}
      <div className="glass-card rounded-2xl p-6 text-center space-y-4 border-cyan-500/30">
        <h3 className="text-lg font-bold text-white">
          {lang === 'es'
            ? '¿Listo para Crear tu Primer Enlace Protegido?'
            : 'Ready to Create Your First Protected Link?'}
        </h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          {lang === 'es'
            ? 'Prueba la custodia on-chain en Arbitrum Sepolia y la resolución de disputas por IA en menos de 10 segundos.'
            : 'Test on-chain escrow on Arbitrum Sepolia and AI dispute resolution in under 10 seconds.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition text-xs"
        >
          <span>{lang === 'es' ? 'Crear Enlace Ahora' : 'Create Payment Link Now'}</span>
        </Link>
      </div>
    </div>
  );
}
