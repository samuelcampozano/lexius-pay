'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, ExternalLink, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const mockEscrows = [
    {
      id: '101',
      description: 'VIP Concert Ticket — ETH Lima Afterparty',
      amount: '50.00 USDC',
      status: 'Deposited',
      role: 'Buyer',
      counterparty: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      date: 'Aug 1, 2026',
    },
    {
      id: '102',
      description: 'Freelance Frontend UI Development',
      amount: '350.00 USDC',
      status: 'Disputed',
      role: 'Seller',
      counterparty: '0x3C44CdD459193653841586395bcfA5A7b42d506e',
      date: 'Jul 31, 2026',
    },
    {
      id: '103',
      description: 'MacBook Air M2 Purchase',
      amount: '800.00 USDC',
      status: 'Completed',
      role: 'Buyer',
      counterparty: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      date: 'Jul 28, 2026',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Escrow Dashboard</h1>
          <p className="text-xs text-slate-400">Track and manage your active Stylus escrow agreements</p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
        >
          + New Escrow Link
        </Link>
      </div>

      {/* Escrow List */}
      <div className="space-y-4">
        {mockEscrows.map((item) => (
          <div
            key={item.id}
            className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  #{item.id}
                </span>
                <span className="text-xs text-slate-400 font-medium">{item.role}</span>
                <span className="text-xs text-slate-600">•</span>
                <span className="text-xs text-slate-500">{item.date}</span>
              </div>
              <h3 className="font-bold text-white text-base">{item.description}</h3>
              <p className="text-xs text-slate-400 font-mono">Counterparty: {item.counterparty}</p>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-slate-800 pt-3 sm:pt-0">
              <div className="text-right">
                <span className="text-lg font-bold text-white font-mono">{item.amount}</span>
                <div className="mt-1">
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      item.status === 'Deposited'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : item.status === 'Disputed'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/pay/${item.id}`}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
                  title="View Escrow"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                {item.status === 'Disputed' && (
                  <Link
                    href={`/dispute/${item.id}`}
                    className="p-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl transition-colors"
                    title="Open AI Dispute Center"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
