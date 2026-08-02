'use client';

import React from 'react';
import Link from 'next/link';
import WalletLogin from './WalletLogin';
import { Shield, Sparkles, LayoutDashboard, ExternalLink } from 'lucide-react';

export default function Navbar() {
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
            <span className="text-[10px] text-slate-400 font-medium">Autonomous P2P Escrow</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/" className="hover:text-blue-400 transition-colors">
            Create Link
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Dashboard</span>
          </Link>
          <Link href="/dispute/demo" className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors">
            <Sparkles className="w-4 h-4" />
            <span>AI Mediator Simulator</span>
          </Link>
        </div>

        {/* Wallet Login / Passkey */}
        <WalletLogin />
      </div>
    </nav>
  );
}
