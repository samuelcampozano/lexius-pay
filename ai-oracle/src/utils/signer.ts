import { Wallet, solidityPackedKeccak256, getBytes, Signature } from 'ethers';

export interface SignedVerdict {
  escrowId: string;
  winner: string;
  signature: string;
  v: number;
  r: string;
  s: string;
  oracleAddress: string;
}

/**
 * Signs a dispute verdict for on-chain execution.
 * 
 * CRITICAL: The Rust Stylus contract (crypto.rs) verifies signatures using:
 * 
 *   1. raw_hash = keccak256(escrow_id_u256_be || winner_address_20bytes)
 *   2. eth_hash = keccak256("\x19Ethereum Signed Message:\n32" || raw_hash)
 *   3. ecrecover(eth_hash, v, r, s) == oracle_address
 * 
 * Therefore, we must use `wallet.signMessage(getBytes(rawHash))` which
 * internally applies the EIP-191 prefix ("\x19Ethereum Signed Message:\n32"),
 * making the signature compatible with the contract's ecrecover verification.
 * 
 * Using `wallet.signingKey.sign(rawHash)` would NOT work because it signs
 * the raw hash without the EIP-191 prefix, and the contract expects the prefix.
 */
export async function signDisputeVerdict(
  escrowId: string,
  winnerAddress: string,
  privateKey: string
): Promise<SignedVerdict> {
  const wallet = new Wallet(privateKey);

  // Step 1: Compute raw hash = keccak256(abi.encodePacked(uint256(escrowId), address(winner)))
  // This matches the Rust contract's: keccak256(escrow_id.to_be_bytes::<32>() || winner.as_slice())
  const rawHash = solidityPackedKeccak256(
    ['uint256', 'address'],
    [BigInt(escrowId), winnerAddress]
  );

  // Step 2: Sign with EIP-191 prefix using signMessage
  // signMessage(getBytes(rawHash)) internally does:
  //   keccak256("\x19Ethereum Signed Message:\n32" || rawHash) → then signs with ECDSA
  // This matches the Rust contract's eth_signed_message_hash() function
  const signatureHex = await wallet.signMessage(getBytes(rawHash));

  // Step 3: Split signature into v, r, s components
  const sig = Signature.from(signatureHex);

  return {
    escrowId,
    winner: winnerAddress,
    signature: signatureHex,
    v: sig.v,
    r: sig.r,
    s: sig.s,
    oracleAddress: wallet.address,
  };
}

/**
 * Convenience wrapper that reads ORACLE_PRIVATE_KEY from environment.
 */
export async function signVerdict(
  escrowId: string,
  winner: string
): Promise<SignedVerdict> {
  const privateKey =
    process.env.ORACLE_PRIVATE_KEY ||
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  return signDisputeVerdict(escrowId, winner, privateKey);
}
