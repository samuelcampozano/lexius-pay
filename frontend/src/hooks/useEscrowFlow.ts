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
      await fetchBalances();
      setFlowStep('idle');
    } catch (err: any) {
      console.warn('[useEscrowFlow] Balance check error:', err);
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
    amountUsdc: number,
    sellerAddress: string
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
        
        const maxAllowanceUnits = parseUnits('1000000', 6);
        console.log(`[useEscrowFlow] Enviando aprobación de USDC para el contrato...`);
        const approveHash = await walletClient.writeContract({
          address: USDC_TOKEN_ADDRESS,
          abi: USDC_MINIMAL_ABI,
          functionName: 'approve',
          args: [STYLUS_ESCROW_ADDRESS, maxAllowanceUnits],
          gas: BigInt(120000),
        });

        console.log(`[useEscrowFlow] Aprobación enviada: ${approveHash}. Esperando confirmación del bloque...`);
        
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log("[useEscrowFlow] USDC aprobado con éxito on-chain. Procediendo con el acuerdo...");
        
        setIsApproving(false);
      }

      // 4. Execute Stylus WASM Escrow Creation / Deposit
      setIsDepositing(true);
      setFlowStep('depositing');
      console.log(
        `[useEscrowFlow] Depositing into Escrow #${escrowId} on Stylus WASM...`
      );

      let targetEscrowId = BigInt(
        escrowId === 'demo' ? '101' : escrowId.replace('#', '')
      );

      let needsCreation = false;

      // Check on-chain escrow state to ensure escrow exists and belongs to active wallet
      try {
        const count = (await publicClient.readContract({
          address: STYLUS_ESCROW_ADDRESS,
          abi: STYLUS_ESCROW_ABI,
          functionName: 'getEscrowCount',
        })) as bigint;

        if (targetEscrowId >= count) {
          needsCreation = true;
        } else {
          const escrowInfo = (await publicClient.readContract({
            address: STYLUS_ESCROW_ADDRESS,
            abi: STYLUS_ESCROW_ABI,
            functionName: 'getEscrow',
            args: [targetEscrowId],
          })) as [string, string, bigint, number, string];

          const buyerOnChain = escrowInfo[0];
          const statusOnChain = escrowInfo[3];
          if (
            !buyerOnChain ||
            buyerOnChain === '0x0000000000000000000000000000000000000000' ||
            (statusOnChain === 0 && buyerOnChain.toLowerCase() !== activeWalletAddress.toLowerCase())
          ) {
            needsCreation = true;
          }
        }
      } catch (checkErr) {
        console.warn('[useEscrowFlow] Error checking on-chain state, assuming needs creation:', checkErr);
        needsCreation = true;
      }

      // 2. Initialize Escrow on-chain if missing or assigned to another wallet
      if (needsCreation) {
        try {
          console.log("[useEscrowFlow] Detectado Escrow inexistente o asignado a otra billetera. Creando slot...");
          const dummyDetails = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
          
          const createTxHash = await walletClient.writeContract({
            address: STYLUS_ESCROW_ADDRESS,
            abi: STYLUS_ESCROW_ABI,
            functionName: 'createEscrow',
            args: [
              activeWalletAddress as `0x${string}`, 
              sellerAddress as `0x${string}`, 
              usdcUnits, 
              dummyDetails
            ],
            gas: BigInt(350000)
          });
          
          console.log(`[useEscrowFlow] Transacción de creación enviada: ${createTxHash}. Esperando confirmación del bloque...`);
          
          const receipt = await publicClient.waitForTransactionReceipt({ 
            hash: createTxHash 
          });
          
          console.log("[useEscrowFlow] ¡Bloque confirmado en Arbitrum Sepolia! El acuerdo ya existe on-chain.", receipt);

          // Update target ID to the newly created escrow ID
          const newCount = (await publicClient.readContract({
            address: STYLUS_ESCROW_ADDRESS,
            abi: STYLUS_ESCROW_ABI,
            functionName: 'getEscrowCount',
          })) as bigint;
          targetEscrowId = newCount;

        } catch (createError) {
          console.error("[useEscrowFlow] Error durante la inicialización de emergencia:", createError);
          setErrorMessage("Error de conexión con la blockchain al crear el acuerdo.");
          setIsDepositing(false);
          setFlowStep('error');
          throw new Error('Escrow creation failed');
        }
      }

      console.log(`[useEscrowFlow] Executing deposit for final Escrow ID: #${targetEscrowId}`);
      const depositHash = await walletClient.writeContract({
        address: STYLUS_ESCROW_ADDRESS,
        abi: STYLUS_ESCROW_ABI,
        functionName: 'deposit',
        args: [targetEscrowId],
        gas: BigInt(350000),
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
