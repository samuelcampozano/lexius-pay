import LexiusEscrowAbi from '../../../contracts/abi/LexiusEscrow.json';

export const STYLUS_ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS ||
  '0xc03bfde0441130dbce84128500b77d3edd5c8e33') as `0x${string}`;

export const STYLUS_ESCROW_ABI = LexiusEscrowAbi;
