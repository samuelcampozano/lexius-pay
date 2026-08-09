'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import WalletLogin from './WalletLogin';
import GlossaryModal from './GlossaryModal';
import { LayoutDashboard, BookOpen, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-cyan-950/60 bg-[#040814]/85 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo with glowing aura */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative flex items-center justify-center">
              {/* Glowing cyan background aura ring */}
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative w-10 h-10 rounded-xl bg-[#060c21] border border-cyan-500/30 p-1 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-cyan-500/20">
                <img
                  src="/lexius-logo.png"
                  alt="Lexius Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-xl tracking-tight text-gradient-silver">
                  LEXIUS
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsGlossaryOpen(true);
                  }}
                  title={lang === 'es' ? '¿Qué es WASM? Haz clic para aprender' : 'What is WASM? Click to learn'}
                  className="text-[10px] font-mono font-bold uppercase bg-cyan-950/80 text-cyan-300 hover:text-white hover:bg-cyan-900 border border-cyan-500/30 px-2 py-0.5 rounded-full shadow-inner transition cursor-pointer flex items-center gap-1"
                >
                  <span>WASM</span>
                  <HelpCircle className="w-2.5 h-2.5 text-cyan-400" />
                </button>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Arbitrum Stylus P2P Escrow
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <Link
              href="/"
              className="hover:text-cyan-400 transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 hover:after:w-full after:transition-all"
            >
              {t('navCreate')}
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 hover:after:w-full after:transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400/70" />
              <span>{t('navDashboard')}</span>
            </Link>
            <Link
              href="/learn"
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 hover:after:w-full after:transition-all"
            >
              <BookOpen className="w-4 h-4 text-cyan-400/70" />
              <span>{lang === 'es' ? 'Aprender (WASM/IA)' : 'Learn (WASM/AI)'}</span>
            </Link>
          </div>

          {/* Controls: Language Switcher + Wallet Login */}
          <div className="flex items-center gap-3">
            {/* Quick Glossary Help Button */}
            <button
              onClick={() => setIsGlossaryOpen(true)}
              title={lang === 'es' ? 'Glosario de Términos' : 'Terms Glossary'}
              className="p-2 bg-[#070e24] hover:bg-[#0b173c] text-cyan-300 rounded-xl border border-cyan-900/40 transition flex items-center justify-center"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Language Switcher Pill */}
            <div className="flex items-center bg-[#070e24] border border-cyan-900/40 rounded-xl p-1 text-xs font-semibold shadow-inner">
              <button
                onClick={() => setLang('es')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  lang === 'es'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇪🇸</span> ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  lang === 'en'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇺🇸</span> EN
              </button>
            </div>

            <WalletLogin />
          </div>
        </div>
      </nav>

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </>
  );
}

