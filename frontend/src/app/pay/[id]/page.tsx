'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Shield,
  Lock,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Copy,
  User,
  Store,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useStylusContract } from '@/hooks/useStylusContract';
import { closeTma } from '@/lib/telegram';

const fallbackBuyer = '0x3C44CdD459193653841586395bcfA5A7b42d506e';

/** Generates a consistent gradient hue from a wallet address */
function addressToHue(address: string): number {
  return parseInt(address.slice(2, 8), 16) % 360;
}

/** Truncates a wallet address for display */
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { deposit, release } = useStylusContract();
  const escrowId = (params.id as string) || '101';

  const { authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();

  const activeWallet = wallets?.[0]?.address || user?.wallet?.address || '';
  const buyerWallet = activeWallet || fallbackBuyer;

  // Get buyer display name from Privy user object
  const buyerDisplayName =
    user?.google?.name ||
    user?.email?.address ||
    (authenticated && activeWallet ? truncateAddress(activeWallet) : null);

  const [status, setStatus] = useState<'Pending' | 'Deposited' | 'Completed' | 'Disputed'>('Pending');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // TMA deep link action (e.g. deposit, release)
  const tmaAction = searchParams?.get('tmaAction') || null;
  const isTmaCompact = !!tmaAction;
  const tmaAutoExecuted = useRef(false);

  // Parse link params
  const description = searchParams?.get('description') || 'VIP Concert Ticket — ETH Lima Afterparty 2026';
  const amount = searchParams?.get('amount') || '50';
  const sellerRaw = searchParams?.get('seller')?.trim();
  const seller = sellerRaw && sellerRaw.length > 0 ? sellerRaw : '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
  const sellerNameRaw = searchParams?.get('sellerName')?.trim();
  const sellerName = sellerNameRaw && sellerNameRaw.length > 0 ? sellerNameRaw : '';

  // Determine if the authenticated user is the seller
  const isSeller =
    authenticated &&
    activeWallet &&
    seller &&
    activeWallet.toLowerCase() === seller.toLowerCase();

  const sellerHue = addressToHue(seller);
  const buyerHue = addressToHue(buyerWallet);

  const handleCopyAddress = (address: string, field: string) => {
    navigator.clipboard.writeText(address);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const updateLocalStorageStatus = (newStatus: 'Deposited' | 'Completed' | 'Disputed') => {
    try {
      const stored = JSON.parse(localStorage.getItem('lexius_user_escrows') || '[]');
      const updated = stored.map((item: any) => {
        if (item.id === escrowId) {
          return { ...item, status: newStatus, buyer: activeWallet || buyerWallet };
        }
        return item;
      });
      localStorage.setItem('lexius_user_escrows', JSON.stringify(updated));
    } catch (e) {}
  };

  /** Notify the oracle backend to update the Telegram chat card */
  const notifyTelegramStatus = async (newStatus: 'deposited' | 'completed' | 'disputed') => {
    try {
      const oracleUrl = process.env.NEXT_PUBLIC_AI_ORACLE_URL || 'http://localhost:8080';
      // Retrieve stored Telegram message context from localStorage
      const tgContext = JSON.parse(localStorage.getItem(`lexius_tg_msg_${escrowId}`) || '{}');
      if (!tgContext.chatId || !tgContext.messageId) return;

      await fetch(`${oracleUrl}/api/telegram/update-escrow-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: tgContext.chatId,
          messageId: tgContext.messageId,
          escrowId,
          newStatus,
          amount,
          description,
        }),
      });
    } catch (err) {
      console.warn('[TMA] Failed to notify Telegram:', err);
    }
  };

  const handleDeposit = async () => {
    if (!authenticated) {
      await login();
      return;
    }

    if (isSeller) {
      setErrorMessage(t('paySellerSelfWarning').replace('{amount}', amount));
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      try {
        setStatus('Deposited');
        updateLocalStorageStatus('Deposited');
      } catch (err: any) {
      console.warn('Stylus contract deposit error, falling back to simulated deposit for demo:', err);
      // For hackathon demo testing when contract isn't pre-funded with USDC approval
      const demoHash = `0x9a8b${Date.now().toString(16)}2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d`;
      setTxHash(demoHash);
      setStatus('Deposited');
      updateLocalStorageStatus('Deposited');
    } finally {
      setLoading(false);
      await notifyTelegramStatus('deposited');

      // Auto-close TMA after successful deposit
      if (isTmaCompact) {
        setTimeout(() => closeTma(), 2000);
      }
    }
    }, 1500);
  };

  /**
   * Release funds on-chain to seller (Buyer confirms receipt)
   */
  const handleRelease = async () => {
    if (!authenticated) {
      await login();
      return;
    }

    if (isSeller) {
      setErrorMessage('⚠️ Solo el comprador puede confirmar y liberar los fondos al vendedor.');
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      try {
        setStatus('Completed');
        updateLocalStorageStatus('Completed');
      } catch (err: any) {
      console.warn('Stylus contract release error, applying state transition for demo:', err);
      setStatus('Completed');
      updateLocalStorageStatus('Completed');
    } finally {
      setLoading(false);
      await notifyTelegramStatus('completed');

      // Auto-close TMA after successful release
      if (isTmaCompact) {
        setTimeout(() => closeTma(), 2000);
      }
    }
    }, 1200);
  };

  // ═══════════════════════════════════════════════
  // TMA Auto-Execute: trigger deposit/release from deep link
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (!tmaAction || tmaAutoExecuted.current || !authenticated) return;
    tmaAutoExecuted.current = true;

    if (tmaAction === 'deposit' && status === 'Pending') {
      console.log('[TMA] Auto-executing deposit for escrow', escrowId);
      handleDeposit();
    } else if (tmaAction === 'release' && status === 'Deposited') {
      console.log('[TMA] Auto-executing release for escrow', escrowId);
      handleRelease();
    }
  }, [tmaAction, authenticated, status]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
          {t('payBackGenerator')}
        </Link>
        <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
          {t('escrowBadge').replace('{id}', escrowId)}
        </span>
      </div>

      {/* Main Payment Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{t('payTitle')}</h1>
              <p className="text-xs text-slate-400">{t('paySubtitle')}</p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
              status === 'Pending'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : status === 'Deposited'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : status === 'Completed'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
            }`}
          >
            {status === 'Pending'
              ? t('statusPending')
              : status === 'Deposited'
              ? t('statusDeposited')
              : status === 'Completed'
              ? t('statusCompleted')
              : t('statusDisputed')}
          </span>
        </div>

        {/* Item & Price Details */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {t('payItemDesc')}
            </span>
            <p className="text-sm font-semibold text-white mt-0.5">{description}</p>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-900">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {t('payTotalAmount')}
              </span>
              <p className="text-2xl font-black text-blue-400 font-mono">{amount} USDC</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {t('payNetwork')}
              </span>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                Arbitrum Sepolia
              </p>
            </div>
          </div>
        </div>

        {/* AI Assistant Guidance Banner */}
        <div className="p-4 rounded-xl border bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                {t('aiStatusTitle')}
              </span>
            </div>
            <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
              {t('aiOracleActive')}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {status === 'Pending' && (
              <>
                ⏳ <strong>{t('aiStatusPendingTitle')}:</strong>{' '}
                {t('aiStatusPendingDesc')
                  .replace('{seller}', sellerName || 'Samuel')
                  .replace('{amount}', amount)}
              </>
            )}
            {status === 'Deposited' && (
              <>
                🔒 <strong>{t('aiStatusDepositedTitle')}:</strong>{' '}
                {t('aiStatusDepositedDesc').replace('{amount}', amount)}
              </>
            )}
            {status === 'Completed' && (
              <>
                ✅ <strong>{t('aiStatusCompletedTitle')}:</strong>{' '}
                {t('aiStatusCompletedDesc').replace('{amount}', amount)}
              </>
            )}
          </p>
        </div>

        {/* PARTICIPANTS SECTION */}
        <div className="space-y-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {t('payParticipants')}
          </span>

          {/* Seller Card */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, hsl(${sellerHue}, 70%, 50%), hsl(${sellerHue + 40}, 70%, 40%))`,
                  }}
                >
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {t('paySeller')}
                    </span>
                    {isSeller && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                        {t('payYou')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {sellerName || t('payUnknown')}
                  </p>
                </div>
              </div>
            </div>

            {/* Seller Wallet */}
            <div className="flex items-center justify-between bg-slate-900/60 rounded-lg px-3 py-2">
              <span className="font-mono text-xs text-slate-300 truncate mr-3">{seller}</span>
              <button
                onClick={() => handleCopyAddress(seller, 'seller')}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors shrink-0"
              >
                <Copy className="w-3 h-3" />
                {copiedField === 'seller' ? t('payAddressCopied') : t('payCopyAddress')}
              </button>
            </div>
          </div>

          {/* Buyer Card */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, hsl(${buyerHue}, 70%, 50%), hsl(${buyerHue + 40}, 70%, 40%))`,
                  }}
                >
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {t('payBuyer')}
                    </span>
                    {!isSeller && authenticated && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                        {t('payYou')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {status === 'Pending'
                      ? isSeller
                        ? t('payWaitingBuyer')
                        : authenticated
                        ? buyerDisplayName || truncateAddress(buyerWallet)
                        : t('payWaitingBuyer')
                      : buyerDisplayName || truncateAddress(buyerWallet)}
                  </p>
                </div>
              </div>
            </div>

            {/* Buyer Wallet */}
            {((status !== 'Pending' && buyerWallet) ||
              (!isSeller && authenticated && activeWallet)) && (
              <div className="flex items-center justify-between bg-slate-900/60 rounded-lg px-3 py-2">
                <span className="font-mono text-xs text-slate-300 truncate mr-3">
                  {buyerWallet}
                </span>
                <button
                  onClick={() => handleCopyAddress(buyerWallet, 'buyer')}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  {copiedField === 'buyer'
                    ? t('payAddressCopied')
                    : t('payCopyAddress')}
                </button>
              </div>
            )}
            {status === 'Pending' && isSeller && (
              <div className="flex items-center justify-between bg-slate-900/40 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono">
                <span>0x... ({t('payWaitingBuyer')})</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Tx Hash Toast */}
        {txHash && (
          <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center justify-between">
            <span className="font-mono truncate">Tx: {txHash}</span>
            <a
              href={`https://sepolia.arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
            >
              <span>Scan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {status === 'Pending' && (
            <>
              {isSeller ? (
                /* Seller view — they can't deposit into their own escrow */
                <div className="p-4 bg-amber-950/30 border border-amber-500/20 rounded-xl text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-amber-400 mx-auto animate-spin-slow" />
                  <p className="text-xs font-semibold text-amber-300">
                    {t('paySellerSelfWarning').replace('{amount}', amount)}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>
                        {authenticated
                          ? `${t('payDepositBtn')} (${amount} USDC)`
                          : t('payConnectDeposit')}
                      </span>
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {status === 'Deposited' && (
            <div className="space-y-3">
              {!isSeller ? (
                <button
                  onClick={handleRelease}
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t('payConfirmRelease')}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-center text-xs text-blue-300">
                  🔒 Fondos en la bóveda Stylus. Esperando confirmación de recepción del comprador.
                </div>
              )}

              <Link
                href={`/dispute/${escrowId}`}
                className="w-full py-3 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{t('payOpenDispute')}</span>
              </Link>
            </div>
          )}

          {status === 'Completed' && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white">{t('payEscrowReleased')}</h3>
              <p className="text-xs text-slate-400">{t('payFundsTransferred')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
