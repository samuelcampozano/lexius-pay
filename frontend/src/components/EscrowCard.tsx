'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ExternalLink } from 'lucide-react';
import { EscrowItem } from '@/types';

export default function EscrowCard({ escrow }: { escrow: EscrowItem }) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-cyan-500/20">
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-300 font-bold bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
            #{escrow.id}
          </span>
          <span className="text-xs text-slate-400">{escrow.createdAt}</span>
        </div>
        <h3 className="font-bold text-white text-base">{escrow.description}</h3>
        <p className="text-xs text-slate-400 font-mono">Seller: {escrow.seller}</p>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-cyan-950 pt-3 sm:pt-0">
        <div className="text-right">
          <span className="text-lg font-extrabold text-white font-mono">{escrow.amount}</span>
          <div className="mt-1">
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                escrow.status === 'Deposited'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                  : escrow.status === 'Disputed'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {escrow.status}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/pay/${escrow.id}`}
            className="p-2.5 bg-[#070e24] hover:bg-cyan-950 text-cyan-300 rounded-xl border border-cyan-900/40 transition-colors shadow-sm"
            title="View Escrow"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          {escrow.status === 'Disputed' && (
            <Link
              href={`/dispute/${escrow.id}`}
              className="p-2.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-xl transition-colors shadow-sm"
              title="Open AI Dispute Center"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

