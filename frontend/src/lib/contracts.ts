export const STYLUS_ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const STYLUS_ESCROW_ABI = [
  {
    name: 'create_escrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'buyer', type: 'address' },
      { name: 'seller', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'details_hash', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'escrow_id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'release',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrow_id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'refund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrow_id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'raise_dispute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrow_id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'resolve_dispute_with_signature',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrow_id', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
] as const;
