'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, ExternalLink } from 'lucide-react';
import { EscrowItem } from '@/types';

export default function EscrowCard({ escrow }: { escrow: EscrowItem }) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            #{escrow.id}
          </span>
          <span className="text-xs text-slate-500">{escrow.createdAt}</span>
        </div>
        <h3 className="font-bold text-white text-base">{escrow.description}</h3>
        <p className="text-xs text-slate-400 font-mono">Seller: {escrow.seller}</p>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-slate-800 pt-3 sm:pt-0">
        <div className="text-right">
          <span className="text-lg font-bold text-white font-mono">{escrow.amount}</span>
          <div className="mt-1">
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                escrow.status === 'Deposited'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : escrow.status === 'Disputed'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {escrow.status}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/pay/${escrow.id}`}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
            title="View Escrow"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          {escrow.status === 'Disputed' && (
            <Link
              href={`/dispute/${escrow.id}`}
              className="p-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl transition-colors"
              title="Open AI Dispute Center"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
