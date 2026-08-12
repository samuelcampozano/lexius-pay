'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback } from 'react';

/**
 * Detects whether the app is running inside a Telegram Mini App (TMA) webview.
 * TMA sandboxes block window.open(), so we must use redirect-based OAuth.
 */
export function isTelegramWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent ?? '';
  const hasTelegramGlobal =
    typeof (window as Window & { Telegram?: { WebApp?: unknown } }).Telegram
      ?.WebApp !== 'undefined';
  const isTelegramUA =
    ua.includes('TelegramBot') ||
    ua.includes('Telegram') ||
    ua.includes('WebView');

  // Check for TMA initData presence — the most reliable signal.
  const hasTMAInitData = (() => {
    try {
      return (
        (window as Window & { Telegram?: { WebApp?: { initData?: string } } })
          .Telegram?.WebApp?.initData !== ''
      );
    } catch {
      return false;
    }
  })();

  return hasTelegramGlobal || hasTMAInitData || isTelegramUA;
}

export function usePrivyAuth() {
  const { login, logout, authenticated, ready, user, linkGoogle } = usePrivy();
  const { wallets } = useWallets();

  const activeWallet =
    wallets.find((w) => w.walletClientType !== 'privy') || wallets[0];
  const walletAddress = activeWallet?.address;

  /**
   * Smart login that detects the TMA context.
   * In TMA: uses redirect flow (no popups allowed).
   * In browser: uses Privy's default modal (popup or redirect per Privy config).
   */
  const smartLogin = useCallback(() => {
    login({
      loginMethods: ['google', 'telegram', 'wallet'],
    } as any);
  }, [login]);

  const googleLogin = useCallback(() => {
    // linkGoogle triggers the Google-specific OAuth flow. Privy will
    // automatically use a redirect on platforms where popups are blocked.
    if (authenticated) {
      linkGoogle();
    } else {
      login();
    }
  }, [authenticated, login, linkGoogle]);

  return {
    login: smartLogin,
    googleLogin,
    logout,
    authenticated,
    ready,
    user,
    activeWallet,
    embeddedWallet: activeWallet,
    walletAddress,
    isTMA: isTelegramWebView(),
  };
}
