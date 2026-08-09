'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-cyan-950/60 bg-[#030611]/80 backdrop-blur-md py-8 text-center text-xs text-slate-500 relative">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img
            src="/lexius-logo.png"
            alt="Lexius Logo"
            className="w-5 h-5 object-contain opacity-80"
          />
          <span className="font-heading font-semibold text-slate-400">
            Lexius Pay
          </span>
          <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
            Arbitrum Stylus WASM
          </span>
        </div>
        <p className="text-slate-500">
          {t('footerText')}
        </p>
      </div>
    </footer>
  );
}
