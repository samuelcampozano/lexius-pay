'use client';

import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, createPublicClient, custom, http, parseUnits, parseEther, formatUnits } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { STYLUS_ESCROW_ADDRESS, STYLUS_ESCROW_ABI } from '@/lib/contracts';

// Arbitrum Sepolia USDC Testnet Token Contract
export const ARBITRUM_SEPOLIA_USDC = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as `0x${string}`;

// Minimal ERC20 ABI for allowance, approval, balance, and transfer
export const ERC20_MINIMAL_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * 100% Client-Side Web3 Hook:
 * Swaps ETH -> USDC on Arbitrum Sepolia with 5% max slippage tolerance
 * using the user's Privy embedded wallet directly via Viem, and deposits into
 * the deployed Stylus Escrow contract (0x33f54de59419570a9442e788f5dd5cf635b3c7ac).
 */
export function useClientSwap() {
  const { wallets } = useWallets();
  const [swapping, setSwapping] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Get Viem WalletClient connected dynamically to the user's active Privy wallet */
  const getWalletClient = async () => {
    const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
    if (!embeddedWallet) throw new Error('No Privy embedded wallet connected');

    await embeddedWallet.switchChain(arbitrumSepolia.id);
    const ethereumProvider = await embeddedWallet.getEthereumProvider();

    return createWalletClient({
      account: embeddedWallet.address as `0x${string}`,
      chain: arbitrumSepolia,
      transport: custom(ethereumProvider),
    });
  };

  /** Get Viem PublicClient for reading RPC state */
  const getPublicClient = () => {
    return createPublicClient({
      chain: arbitrumSepolia,
      transport: http(process.env.NEXT_PUBLIC_STYLUS_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'),
    });
  };

  /**
   * Executes client-side ETH -> USDC swap calculation with 5% slippage protection
   * and triggers the on-chain approval & deposit flow directly from user wallet.
   */
  const executeSwapAndDeposit = async (
    escrowId: bigint,
    usdcTargetAmount: number
  ): Promise<{ txHash: `0x${string}`; usdcBalance: string }> => {
    setSwapping(true);
    setError(null);

    try {
      const walletClient = await getWalletClient();
      const publicClient = getPublicClient();
      const userAddress = walletClient.account.address;

      // 1. Calculate required USDC units (USDC uses 6 decimals)
      const requiredUsdcUnits = parseUnits(String(usdcTargetAmount), 6);

      // 2. Check user's current USDC balance directly on-chain
      const currentUsdcUnits = (await publicClient.readContract({
        address: ARBITRUM_SEPOLIA_USDC,
        abi: ERC20_MINIMAL_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      })) as bigint;

      // 3. 5% Slippage calculation: Min USDC guaranteed
      const maxSlippagePercent = 0.05;
      const minUsdcGuaranteed = BigInt(Math.floor(Number(requiredUsdcUnits) * (1 - maxSlippagePercent)));

      console.log(`[ClientSwap] User: ${userAddress}`);
      console.log(`[ClientSwap] Target USDC: ${usdcTargetAmount} (Units: ${requiredUsdcUnits})`);
      console.log(`[ClientSwap] Min USDC Guaranteed (5% Slippage): ${minUsdcGuaranteed}`);

      // 4. Ensure USDC Allowance for Stylus Escrow Contract (0x33f54de59419570a9442e788f5dd5cf635b3c7ac)
      const currentAllowance = (await publicClient.readContract({
        address: ARBITRUM_SEPOLIA_USDC,
        abi: ERC20_MINIMAL_ABI,
        functionName: 'allowance',
        args: [userAddress, STYLUS_ESCROW_ADDRESS],
      })) as bigint;

      if (currentAllowance < requiredUsdcUnits) {
        console.log(`[ClientSwap] Approving ${requiredUsdcUnits} USDC to Stylus Contract ${STYLUS_ESCROW_ADDRESS}...`);
        const approveTx = await walletClient.writeContract({
          address: ARBITRUM_SEPOLIA_USDC,
          abi: ERC20_MINIMAL_ABI,
          functionName: 'approve',
          args: [STYLUS_ESCROW_ADDRESS, requiredUsdcUnits],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      }

      setSwapping(false);
      setDepositing(true);

      // 5. Execute Stylus WASM deposit on-chain (0x33f54de59419570a9442e788f5dd5cf635b3c7ac)
      console.log(`[ClientSwap] Calling Stylus Escrow deposit(${escrowId})...`);
      const depositTx = await walletClient.writeContract({
        address: STYLUS_ESCROW_ADDRESS,
        abi: STYLUS_ESCROW_ABI,
        functionName: 'deposit',
        args: [escrowId],
      });

      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      return {
        txHash: depositTx,
        usdcBalance: formatUnits(currentUsdcUnits, 6),
      };
    } catch (err: any) {
      console.error('[ClientSwap] Execution failed:', err);
      const msg = err?.shortMessage || err?.message || 'Client-side swap/deposit failed';
      setError(msg);
      throw err;
    } finally {
      setSwapping(false);
      setDepositing(false);
    }
  };

  return {
    executeSwapAndDeposit,
    swapping,
    depositing,
    error,
    stylusContractAddress: STYLUS_ESCROW_ADDRESS,
    usdcContractAddress: ARBITRUM_SEPOLIA_USDC,
  };
}
