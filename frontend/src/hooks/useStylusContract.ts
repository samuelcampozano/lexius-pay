'use client';

import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, createPublicClient, custom, http, parseEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { STYLUS_ESCROW_ADDRESS, STYLUS_ESCROW_ABI } from '@/lib/contracts';

/**
 * Hook for interacting with the LexiusEscrow Stylus WASM contract on Arbitrum Sepolia.
 * Uses viem for all contract calls, compatible with Privy embedded wallets.
 */
export function useStylusContract() {
  const { wallets } = useWallets();

  /** Get a viem WalletClient from the user's Privy embedded wallet */
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

  /** Get a viem PublicClient for read-only calls */
  const getPublicClient = () => {
    return createPublicClient({
      chain: arbitrumSepolia,
      transport: http(process.env.NEXT_PUBLIC_STYLUS_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'),
    });
  };

  // ═══════════════════════════════════════════════
  // WRITE FUNCTIONS (require wallet signature)
  // ═══════════════════════════════════════════════

  /** Create a new escrow agreement between buyer and seller */
  const create_escrow = async (
    buyer: `0x${string}`,
    seller: `0x${string}`,
    amount: bigint,
    detailsHash: `0x${string}`
  ) => {
    const client = await getClient();
    const txHash = await client.writeContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'createEscrow',
      args: [buyer, seller, amount, detailsHash],
      gas: BigInt(350000),
    });
    return txHash;
  };

  /** Deposit funds into an escrow (buyer calls this) */
  const deposit = async (escrowId: bigint) => {
    const client = await getClient();
    const txHash = await client.writeContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'deposit',
      args: [escrowId],
      gas: BigInt(350000),
    });
    return txHash;
  };

  /** Release funds to the seller (buyer confirms receipt) */
  const release = async (escrowId: bigint) => {
    const client = await getClient();
    const txHash = await client.writeContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'release',
      args: [escrowId],
      gas: BigInt(350000),
    });
    return txHash;
  };

  /** Refund funds to the buyer (seller cancels) */
  const refund = async (escrowId: bigint) => {
    const client = await getClient();
    const txHash = await client.writeContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'refund',
      args: [escrowId],
      gas: BigInt(350000),
    });
    return txHash;
  };

  /** Raise a dispute on an active escrow */
  const raise_dispute = async (escrowId: bigint) => {
    const client = await getClient();
    const txHash = await client.writeContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'raiseDispute',
      args: [escrowId],
      gas: BigInt(350000),
    });
    return txHash;
  };

  /** Cancel an escrow before deposit */
  const cancel_escrow = async (escrowId: bigint) => {
    const client = await getClient();
    const txHash = await client.writeContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'cancelEscrow',
      args: [escrowId],
      gas: BigInt(350000),
    });
    return txHash;
  };

  /**
   * Execute the AI oracle's signed verdict on-chain.
   * The contract verifies the ECDSA signature using ecrecover to ensure
   * only the authorized oracle can resolve disputes.
   */
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
      functionName: 'resolveDisputeWithSignature',
      args: [escrowId, winner, v, r, s],
      gas: BigInt(450000),
    });
    return hash;
  };

  // ═══════════════════════════════════════════════
  // READ FUNCTIONS (no wallet needed)
  // ═══════════════════════════════════════════════

  /** Get escrow details by ID */
  const get_escrow = async (escrowId: bigint) => {
    const publicClient = getPublicClient();
    const result = await publicClient.readContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'getEscrow',
      args: [escrowId],
    });
    return result;
  };

  /** Get total number of escrows created */
  const get_escrow_count = async () => {
    const publicClient = getPublicClient();
    const result = await publicClient.readContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'getEscrowCount',
    });
    return result;
  };

  /** Get the authorized oracle address */
  const get_oracle = async () => {
    const publicClient = getPublicClient();
    const result = await publicClient.readContract({
      address: STYLUS_ESCROW_ADDRESS,
      abi: STYLUS_ESCROW_ABI,
      functionName: 'get_oracle',
    });
    return result;
  };

  return {
    // Write functions
    create_escrow,
    deposit,
    release,
    refund,
    raise_dispute,
    cancel_escrow,
    resolveDisputeWithSignature,
    // Read functions
    get_escrow,
    get_escrow_count,
    get_oracle,
  };
}
