'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';

export function usePrivyAuth() {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
  const walletAddress = embeddedWallet?.address;

  return {
    login,
    logout,
    authenticated,
    ready,
    user,
    embeddedWallet,
    walletAddress,
  };
}
