import { ethers } from 'ethers';

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
  const wallet = new ethers.Wallet(privateKey);

  // 1. Construct message payload: keccak256(concat(escrowId, winnerAddress))
  const messageHash = ethers.solidityPackedKeccak256(
    ['uint256', 'address'],
    [BigInt(escrowId), winnerAddress]
  );

  // 2. Sign Ethereum Signed Message Hash
  const signatureBytes = await wallet.signMessage(ethers.getBytes(messageHash));
  const sig = ethers.Signature.from(signatureBytes);

  return {
    escrowId,
    winner: winnerAddress,
    signature: signatureBytes,
    v: sig.v,
    r: sig.r,
    s: sig.s,
    oracleAddress: wallet.address,
  };
}
