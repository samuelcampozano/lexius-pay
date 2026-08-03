import { Wallet, solidityPackedKeccak256 } from 'ethers';

export interface SignedVerdict {
  escrowId: string;
  winner: string;
  signature: string;
  v: number;
  r: string;
  s: string;
  oracleAddress: string;
}

export async function signDisputeVerdict(
  escrowId: string,
  winnerAddress: string,
  privateKey: string
): Promise<SignedVerdict> {
  const wallet = new Wallet(privateKey);

  // 1. Construct message payload: keccak256(concat(escrowId, winnerAddress))
  const messageHash = solidityPackedKeccak256(
    ['uint256', 'address'],
    [BigInt(escrowId), winnerAddress]
  );

  // 2. Sign the raw digest directly so the signature can be verified with ecrecover
  const signature = wallet.signingKey.sign(messageHash);

  return {
    escrowId,
    winner: winnerAddress,
    signature: signature.serialized,
    v: signature.v,
    r: signature.r,
    s: signature.s,
    oracleAddress: wallet.address,
  };
}
