'use client';

import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, parseEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { STYLUS_ESCROW_ADDRESS, STYLUS_ESCROW_ABI } from '@/lib/contracts';

export function useStylusContract() {
  const { wallets } = useWallets();

  const getClient = async () => {
    const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
    if (!embeddedWallet) throw new Error('No embedded wallet available');

    await embeddedWallet.switchChain(arbitrumSepolia.id);
    const ethereumProvider = await embeddedWallet.getEthereumProvider();

    return createWalletClient({
      account: embeddedWallet.address as `0x${string}`,
      chain: arbitrumSepolia,
      transport: custom(ethereumProvider),
    });
  };

  const depositFunds = async (escrowId: bigint) => {
    const client = await getClient();
    const txHash = await client.writeContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'create_escrow',
      args: [buyer, seller, parseEther(amountEth), detailsHash],
    });
    return txHash;
  };

  const deposit = async (escrowId: bigint, amountEth: string) => {
    const client = await getClient();
    const txHash = await client.writeContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'deposit',
      args: [escrowId],
    });
    return txHash;
  };

  const release = async (escrowId: bigint) => {
    const client = await getClient();
    const txHash = await client.writeContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'release',
      args: [escrowId],
    });
    return txHash;
  };

  const resolveDisputeWithSignature = async (
    escrowId: bigint,
    winner: `0x${string}`,
    v: number,
    r: `0x${string}`,
    s: `0x${string}`
  ) => {
    const client = await getClient();
    const hash = await client.writeContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'resolve_dispute_with_signature',
      args: [escrowId, winner, v, r, s],
    });
    return hash;
  };

  return {
    create_escrow,
    deposit,
    release,
    resolveDisputeWithSignature,
  };
}
