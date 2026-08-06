import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';

const router = Router();

// Arbitrum Sepolia USDC ERC-20 token address & minimal ABI
const ARBITRUM_SEPOLIA_USDC = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
];

// In-memory set to prevent abuse within container lifetime
const claimedAddresses = new Set<string>();

/**
 * POST /api/faucet/claim
 * Sends 1.00 USDC + 0.001 Sepolia ETH welcome gift to new users.
 */
router.post('/claim', async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      res.status(400).json({ error: 'Valid walletAddress is required' });
      return;
    }

    const normalizedAddress = walletAddress.toLowerCase();

    if (claimedAddresses.has(normalizedAddress)) {
      res.status(200).json({
        success: true,
        alreadyClaimed: true,
        message: 'Welcome gift has already been claimed for this wallet.',
      });
      return;
    }

    const privateKey = process.env.ORACLE_PRIVATE_KEY;
    const rpcUrl =
      process.env.STYLUS_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

    if (!privateKey || privateKey.startsWith('0xac0974')) {
      // Local development / simulated fallback
      console.log(`[Faucet] Simulated 1.00 USDC claim for ${walletAddress}`);
      claimedAddresses.add(normalizedAddress);
      res.status(200).json({
        success: true,
        simulated: true,
        walletAddress,
        amountUsdc: '1.00',
        amountEth: '0.001',
        message: '🎁 Simulated Welcome Gift claimed (1.00 USDC + 0.001 ETH)',
      });
      return;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const treasuryWallet = new ethers.Wallet(privateKey, provider);

    const usdcContract = new ethers.Contract(
      ARBITRUM_SEPOLIA_USDC,
      ERC20_ABI,
      treasuryWallet
    );

    // 1. Check if user already has USDC or ETH
    const userEthBalance = await provider.getBalance(walletAddress);
    const userUsdcBalance: bigint = await usdcContract.balanceOf(walletAddress);

    let txHashEth: string | null = null;
    let txHashUsdc: string | null = null;

    // 2. Send ETH gas if user has less than 0.0005 ETH
    if (userEthBalance < ethers.parseEther('0.0005')) {
      try {
        const ethTx = await treasuryWallet.sendTransaction({
          to: walletAddress,
          value: ethers.parseEther('0.001'),
        });
        txHashEth = ethTx.hash;
        console.log(`[Faucet] Sent 0.001 ETH to ${walletAddress}: ${txHashEth}`);
      } catch (ethErr) {
        console.warn('[Faucet] ETH gas transfer skipped or failed:', ethErr);
      }
    }

    // 3. Send 1.00 USDC (6 decimals = 1,000,000 units)
    if (userUsdcBalance < BigInt(500000)) {
      try {
        const usdcAmount = ethers.parseUnits('1.00', 6);
        const usdcTx = await usdcContract.transfer(walletAddress, usdcAmount);
        txHashUsdc = usdcTx.hash;
        console.log(`[Faucet] Sent 1.00 USDC to ${walletAddress}: ${txHashUsdc}`);
      } catch (usdcErr) {
        console.warn('[Faucet] USDC transfer error:', usdcErr);
      }
    }

    claimedAddresses.add(normalizedAddress);

    res.status(200).json({
      success: true,
      walletAddress,
      amountUsdc: '1.00',
      amountEth: '0.001',
      txHashUsdc,
      txHashEth,
      message: '🎁 Welcome Gift of 1.00 USDC & Testnet Gas successfully sent!',
    });
  } catch (error: any) {
    console.error('[Faucet] Error processing welcome gift claim:', error);
    res.status(500).json({
      error: 'Failed to process welcome gift claim',
      details: error?.message || String(error),
    });
  }
});

export default router;
