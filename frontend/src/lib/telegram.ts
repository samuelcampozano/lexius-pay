'use client';

import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    start_param?: string;
  };
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
}

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  const tgWindow = window as TelegramWindow;
  return tgWindow.Telegram?.WebApp ?? null;
}

export function initTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  try {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready?.();
      tg.expand?.();
      return tg;
    }
    if (typeof WebApp?.ready === 'function') {
      WebApp.ready();
    }
    if (typeof WebApp?.expand === 'function') {
      WebApp.expand();
    }
    return null;
  } catch (error) {
    console.warn('Telegram WebApp initialization skipped:', error);
    return null;
  }
}

export function useTelegramWebApp() {
  useEffect(() => {
    initTelegramWebApp();
  }, []);
}

// ═══════════════════════════════════════════════════════════════
// TMA Start Parameter Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Reads the `startapp` / `tgWebAppStartParam` parameter.
 * Priority: Telegram.WebApp.initDataUnsafe.start_param > URL search params
 */
export function getTmaStartParam(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Try Telegram native object
  const tg = getTelegramWebApp();
  const nativeParam = (tg?.initDataUnsafe as any)?.start_param;
  if (nativeParam) return nativeParam;

  // 2. Fallback: URL search param (useful for local testing)
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('tgWebAppStartParam') || null;
  } catch {
    return null;
  }
}

/**
 * Parse a TMA start parameter into action + escrowId.
 * Format: `{action}_{escrowId}` e.g. `deposit_705`, `release_705`
 */
export function parseTmaStartParam(param: string): { action: string; escrowId: string } | null {
  if (!param) return null;
  const underscoreIndex = param.indexOf('_');
  if (underscoreIndex === -1) {
    // Single ID format e.g. startapp=15 -> default action 'deposit'
    return { action: 'deposit', escrowId: param };
  }
  const action = param.slice(0, underscoreIndex);
  const escrowId = param.slice(underscoreIndex + 1);
  if (!action || !escrowId) return null;
  return { action, escrowId };
}

/**
 * Safely close the Telegram Mini App.
 */
export function closeTma(): void {
  if (typeof window === 'undefined') return;
  try {
    const tg = getTelegramWebApp();
    tg?.close?.();
  } catch (err) {
    console.warn('closeTma failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// Wallet Address Caching (localStorage + DeviceStorage fallback)
// ═══════════════════════════════════════════════════════════════

const WALLET_CACHE_KEY = 'lexius_cached_wallet';

/**
 * Cache the user's Privy wallet address for instant auto-fill.
 */
export function cacheWalletAddress(address: string): void {
  if (typeof window === 'undefined' || !address) return;
  try {
    localStorage.setItem(WALLET_CACHE_KEY, address);
  } catch {}
  
  // Attempt Telegram DeviceStorage if available (SDK v8+)
  try {
    const tg = getTelegramWebApp() as any;
    if (tg?.DeviceStorage?.setItem) {
      tg.DeviceStorage.setItem(WALLET_CACHE_KEY, address);
    }
  } catch {}
}

/**
 * Retrieve the cached wallet address.
 */
export function getCachedWalletAddress(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(WALLET_CACHE_KEY);
  } catch {
    return null;
  }
}
