/**
 * Lexius Escrow Contract Integration
 * 
 * Uses the official ABI from contracts/abi/LexiusEscrow.json deployed by Samuel (DEV 1).
 * Contract Address: Arbitrum Sepolia Testnet
 */

// Import the official ABI generated from the Rust Stylus contract
import EscrowABIJson from './LexiusEscrow.json';

// Export the ABI for use with viem
export const EscrowABI = EscrowABIJson;

// Legacy alias — kept for backward compatibility with existing components
export const STYLUS_ESCROW_ABI = EscrowABIJson;

// Contract address from environment (set in .env.local)
export const STYLUS_ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS ||
  '0xc03bfde0441130dbce84128500b77d3edd5c8e33') as `0x${string}`;

// Also export with a cleaner name
export const STYLUS_CONTRACT_ADDRESS = STYLUS_ESCROW_ADDRESS;
