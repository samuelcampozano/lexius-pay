'use client';

import React from 'react';
import Link from 'next/link';
import WalletLogin from './WalletLogin';
import { Shield, Sparkles, LayoutDashboard, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-lg text-white tracking-tight">Lexius</span>
              <span className="font-heading font-bold text-lg text-blue-400">Pay</span>
              <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full">Stylus</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Escrow P2P Autónomo</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/" className="hover:text-blue-400 transition-colors">
            {t('navCreate')}
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>{t('navDashboard')}</span>
          </Link>
          <Link href="/dispute/demo" className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors">
            <Sparkles className="w-4 h-4" />
            <span>{t('navAiSimulator')}</span>
          </Link>
        </div>

        {/* Controls: Language Switcher + Wallet Login */}
        <div className="flex items-center gap-3">
          {/* Language Switcher Pill */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold shadow-inner">
            <button
              onClick={() => setLang('es')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                lang === 'es'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇪🇸</span> ES
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                lang === 'en'
                  ? 'bg-blue-600 text-white shadow-md'
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
  );
}
