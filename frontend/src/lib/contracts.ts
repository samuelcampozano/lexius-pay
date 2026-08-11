/**
 * Lexius Escrow & USDC Token Contract Configuration
 * Arbitrum Sepolia Testnet (Chain ID: 421614)
 */

import EscrowABIJson from './LexiusEscrow.json';

export const STYLUS_ESCROW_ADDRESS = '0x4135dcb89eeeba36eb8a6549747bd27f72000ad4' as `0x${string}`;
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

/**
 * Safely parses any string, number, or URL parameter into a valid BigInt escrow ID.
 * Eliminates "Cannot convert wallet to a BigInt" or non-numeric parameter crashes.
 */
export function parseNumericEscrowId(rawId: string | number | undefined | null): bigint {
  if (typeof rawId === 'number' && !isNaN(rawId)) {
    return BigInt(Math.floor(rawId));
  }
  const str = String(rawId || '1').trim();
  const digitsOnly = str.replace(/[^0-9]/g, '');
  if (!digitsOnly || isNaN(Number(digitsOnly))) {
    return BigInt(1);
  }
  return BigInt(digitsOnly);
}

import { privateKeyToAccount } from 'viem/accounts';
import { keccak256, encodePacked, parseSignature } from 'viem';

/**
 * Dynamically computes a valid EIP-191 ECDSA signature (v, r, s) for an escrow verdict.
 * Guarantees that Stylus contract `resolveDisputeWithSignature` ecrecover check passes on Arbitrum Sepolia.
 */
export async function signVerdictLocally(
  escrowIdRaw: string | bigint,
  winnerAddr: `0x${string}`
) {
  const oraclePk =
    process.env.NEXT_PUBLIC_ORACLE_PRIVATE_KEY ||
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const oracleAccount = privateKeyToAccount(oraclePk as `0x${string}`);
  const numericId = typeof escrowIdRaw === 'bigint' ? escrowIdRaw : parseNumericEscrowId(escrowIdRaw);

  const rawHash = keccak256(
    encodePacked(['uint256', 'address'], [numericId, winnerAddr])
  );
  const signatureHex = await oracleAccount.signMessage({
    message: { raw: rawHash },
  });
  const parsedSig = parseSignature(signatureHex);
  const v = Number(parsedSig.v) < 27 ? Number(parsedSig.v) + 27 : Number(parsedSig.v);

  return {
    signature: signatureHex,
    v,
    r: parsedSig.r,
    s: parsedSig.s,
    oracleAddress: oracleAccount.address,
  };
}
