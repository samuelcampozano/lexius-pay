'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  parseUnits,
  formatUnits,
  formatEther,
} from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import {
  STYLUS_ESCROW_ADDRESS,
  STYLUS_ESCROW_ABI,
  USDC_TOKEN_ADDRESS,
  USDC_MINIMAL_ABI,
} from '@/lib/contracts';

export type FlowStep =
  | 'idle'
  | 'funding'
  | 'approving'
  | 'depositing'
  | 'success'
  | 'error';

/**
 * Hook tying together Privy Embedded Wallet, Backend Auto-Funding Faucet (/api/faucet/drip),
 * and Arbitrum Sepolia Stylus WASM Smart Contract Transactions.
 */
export function useEscrowFlow() {
  const { wallets } = useWallets();
  const { authenticated, user } = usePrivy();

  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [isFunding, setIsFunding] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string>('0.000');
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [txHash, setTxHash] = useState<string | null>(null);

  /** Active embedded wallet address */
  const activeWalletAddress =
    wallets.find((w) => w.walletClientType === 'privy')?.address ||
    wallets[0]?.address ||
    user?.wallet?.address ||
    '';

  /** Get Viem WalletClient connected dynamically to Privy embedded wallet */
  const getWalletClient = async () => {
    const embeddedWallet =
      wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
    if (!embeddedWallet) {
      throw new Error('No Privy embedded wallet connected');
    }

    await embeddedWallet.switchChain(arbitrumSepolia.id);
    const ethereumProvider = await embeddedWallet.getEthereumProvider();

    return createWalletClient({
      account: embeddedWallet.address as `0x${string}`,
      chain: arbitrumSepolia,
      transport: custom(ethereumProvider),
    });
  };

  /** Get Viem PublicClient for read-only RPC queries */
  const getPublicClient = () => {
    return createPublicClient({
      chain: arbitrumSepolia,
      transport: http(
        process.env.NEXT_PUBLIC_STYLUS_RPC_URL ||
          'https://sepolia-rollup.arbitrum.io/rpc'
      ),
    });
  };

  /** Fetch current ETH and USDC balances directly on-chain */
  const fetchBalances = useCallback(async () => {
    if (!activeWalletAddress) return { eth: 0, usdc: 0 };

    try {
      const publicClient = getPublicClient();

      // Read ETH balance
      const rawEth = await publicClient.getBalance({
        address: activeWalletAddress as `0x${string}`,
      });
      const formattedEth = parseFloat(formatEther(rawEth)).toFixed(4);
      setEthBalance(formattedEth);

      // Read USDC balance (6 decimals)
      const rawUsdc = (await publicClient.readContract({
        address: USDC_TOKEN_ADDRESS,
        abi: USDC_MINIMAL_ABI,
        functionName: 'balanceOf',
        args: [activeWalletAddress as `0x${string}`],
      })) as bigint;
      const formattedUsdc = parseFloat(formatUnits(rawUsdc, 6)).toFixed(2);
      setUsdcBalance(formattedUsdc);

      return {
        eth: parseFloat(formattedEth),
        usdc: parseFloat(formattedUsdc),
      };
    } catch (err) {
      console.warn('[useEscrowFlow] Error fetching balances:', err);
      return { eth: 0, usdc: 0 };
    }
  }, [activeWalletAddress]);

  /** Auto-fetch balances when active wallet is available */
  useEffect(() => {
    if (activeWalletAddress) {
      fetchBalances();
    }
  }, [activeWalletAddress, fetchBalances]);

  /**
   * Check wallet balances and trigger backend auto-funding drip (/api/faucet/drip)
   * if ETH < 0.001 or USDC < 1.00.
   */
  const checkAndFundWallet = useCallback(async () => {
    if (!activeWalletAddress) return;

    setIsFunding(true);
    setFlowStep('funding');
    setErrorMessage(null);

    try {
      const balances = await fetchBalances();

      // If user has low ETH (< 0.01 ETH) or low USDC (< 1.00 USDC), drip testnet funds (0.04 ETH + 10 USDC)
      if (balances.eth < 0.01 || balances.usdc < 1.00) {
        console.log(
          `[useEscrowFlow] Low balance detected (ETH: ${balances.eth}, USDC: ${balances.usdc}). Triggering /api/faucet/drip...`
        );
        const oracleUrl =
          process.env.NEXT_PUBLIC_AI_ORACLE_URL || 'http://localhost:8080';

        const response = await fetch(`${oracleUrl}/api/faucet/drip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: activeWalletAddress }),
        });

        const data = await response.json();
        if (data.error) {
          console.warn('[useEscrowFlow] Faucet drip warning:', data.error);
        }

        // Re-fetch balances after drip
        await fetchBalances();
      }

      setFlowStep('idle');
    } catch (err: any) {
      console.warn('[useEscrowFlow] Faucet check error:', err);
      // Non-blocking error for demo continuity
      setFlowStep('idle');
    } finally {
      setIsFunding(false);
    }
  }, [activeWalletAddress, fetchBalances]);

  /**
   * Complete E2E Escrow Deposit Flow:
   * 1. Check & Approve USDC spend for Stylus contract.
   * 2. Execute deposit(escrowId) on Stylus WASM contract on Arbitrum Sepolia.
   */
  const executeUSCDeposit = async (
    escrowId: string,
    amountUsdc: number
  ): Promise<`0x${string}`> => {
    if (!activeWalletAddress) {
      throw new Error('Please connect your wallet first.');
    }

    setErrorMessage(null);
    setTxHash(null);

    try {
      const walletClient = await getWalletClient();
      const publicClient = getPublicClient();

      // 1. Ensure user has sufficient funds (auto-drip if needed)
      await checkAndFundWallet();

      const usdcUnits = parseUnits(String(amountUsdc), 6);

      // 2. Check current USDC allowance for Stylus Escrow Contract
      const currentAllowance = (await publicClient.readContract({
        address: USDC_TOKEN_ADDRESS,
        abi: USDC_MINIMAL_ABI,
        functionName: 'allowance',
        args: [
          activeWalletAddress as `0x${string}`,
          STYLUS_ESCROW_ADDRESS,
        ],
      })) as bigint;

      // 3. Approve USDC spend if allowance is insufficient
      if (currentAllowance < usdcUnits) {
        setIsApproving(true);
        setFlowStep('approving');
        console.log(
          `[useEscrowFlow] Approving ${amountUsdc} USDC to Stylus Contract ${STYLUS_ESCROW_ADDRESS}...`
        );

        const approveHash = await walletClient.writeContract({
          address: USDC_TOKEN_ADDRESS,
          abi: USDC_MINIMAL_ABI,
          functionName: 'approve',
          args: [STYLUS_ESCROW_ADDRESS, usdcUnits],
        });

        console.log(`[useEscrowFlow] USDC Approve Tx sent: ${approveHash}`);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        setIsApproving(false);
      }

      // 4. Execute Stylus WASM Escrow Deposit
      setIsDepositing(true);
      setFlowStep('depositing');
      console.log(
        `[useEscrowFlow] Depositing into Escrow #${escrowId} on Stylus WASM...`
      );

      const numericEscrowId = BigInt(
        escrowId === 'demo' ? '101' : escrowId.replace('#', '')
      );

      const depositHash = await walletClient.writeContract({
        address: STYLUS_ESCROW_ADDRESS,
        abi: STYLUS_ESCROW_ABI,
        functionName: 'deposit',
        args: [numericEscrowId],
      });

      console.log(`[useEscrowFlow] Stylus Deposit Tx sent: ${depositHash}`);
      await publicClient.waitForTransactionReceipt({ hash: depositHash });

      setTxHash(depositHash);
      setFlowStep('success');
      await fetchBalances();

      return depositHash;
    } catch (err: any) {
      console.error('[useEscrowFlow] Deposit error:', err);
      const isUserCancellation =
        err?.name === 'UserRejectedRequestError' ||
        err?.code === 4001 ||
        String(err?.message || '').toLowerCase().includes('rejected') ||
        String(err?.message || '').toLowerCase().includes('denied') ||
        String(err?.shortMessage || '').toLowerCase().includes('rejected') ||
        String(err?.shortMessage || '').toLowerCase().includes('denied');

      const msg = isUserCancellation
        ? 'USER_CANCELLED'
        : err?.shortMessage || err?.message || 'Error during Arbitrum Sepolia deposit';
      setErrorMessage(msg);
      setFlowStep('idle');
      throw err;
    } finally {
      setIsFunding(false);
      setIsApproving(false);
      setIsDepositing(false);
    }
  };

  return {
    flowStep,
    isFunding,
    isApproving,
    isDepositing,
    errorMessage,
    ethBalance,
    usdcBalance,
    txHash,
    activeWalletAddress,
    checkAndFundWallet,
    executeUSCDeposit,
    fetchBalances,
    stylusContractAddress: STYLUS_ESCROW_ADDRESS,
    usdcTokenAddress: USDC_TOKEN_ADDRESS,
  };
}
