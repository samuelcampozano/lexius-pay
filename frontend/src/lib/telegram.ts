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
