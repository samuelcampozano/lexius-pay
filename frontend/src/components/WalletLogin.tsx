'use client';

import React from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function WalletLogin() {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const { t } = useLanguage();

  const activeWallet = wallets[0];
  const address = activeWallet?.address || '';
  
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const getAvatarHue = (addr: string) => {
    if (!addr || addr.length < 8) return 0;
    return parseInt(addr.slice(2, 8), 16) % 360;
  };

  const hue = getAvatarHue(address);

  const handleLogin = () => {
    login({ loginMethods: ['google', 'telegram', 'wallet'] } as any);
  };

  if (!authenticated) {
    return (
      <button
        onClick={handleLogin}
        disabled={!ready}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <ShieldCheck className="w-4 h-4" />
        <span className="text-sm font-medium">{t('navConnect')}</span>
      </button>
    );
  }

  const displayName = user?.google?.name || user?.email?.address;

  return (
    <div className="flex items-center gap-3 pl-2 pr-1 py-1 bg-slate-800 rounded-full border border-slate-700 shadow-sm">
      <div 
        className="w-8 h-8 rounded-full shadow-inner flex-shrink-0"
        style={{ 
          background: `linear-gradient(135deg, hsl(${hue}, 80%, 60%), hsl(${(hue + 40) % 360}, 80%, 40%))` 
        }}
      />
      
      <div className="flex flex-col justify-center">
        {displayName && (
          <span className="text-xs text-white font-medium truncate max-w-[120px]">
            {displayName}
          </span>
        )}
        <span className="text-[10px] text-slate-400 font-mono leading-tight mt-0.5">
          {shortAddress}
        </span>
      </div>

      <button
        onClick={() => logout()}
        className="p-1.5 ml-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
        title="Log out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
