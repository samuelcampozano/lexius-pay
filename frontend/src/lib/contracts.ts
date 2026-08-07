/**
 * Lexius Escrow & USDC Token Contract Configuration
 * Arbitrum Sepolia Testnet (Chain ID: 421614)
 */

import EscrowABIJson from './LexiusEscrow.json';

export const STYLUS_ESCROW_ADDRESS = '0x33f54de59419570a9442e788f5dd5cf635b3c7ac' as `0x${string}`;
export const USDC_TOKEN_ADDRESS = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as `0x${string}`;

export const STYLUS_ESCROW_ABI = EscrowABIJson;
export const EscrowABI = EscrowABIJson;
export const STYLUS_CONTRACT_ADDRESS = STYLUS_ESCROW_ADDRESS;

export const USDC_MINIMAL_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
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
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
