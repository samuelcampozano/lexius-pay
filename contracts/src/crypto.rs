#![no_std]

use alloy_primitives::{Address, B256, U256};
use stylus_sdk::crypto::keccak;

/// Helper function to construct Ethereum Signed Message Hash
pub fn eth_signed_message_hash(escrow_id: U256, winner: Address) -> B256 {
    let mut msg_bytes = [0u8; 52];
    msg_bytes[..32].copy_from_slice(&escrow_id.to_be_bytes::<32>());
    msg_bytes[32..52].copy_from_slice(winner.as_slice());
    let raw_hash = keccak(&msg_bytes);

    let prefix = b"\x19Ethereum Signed Message:\n32";
    let mut eth_msg = [0u8; 60];
    eth_msg[..28].copy_from_slice(prefix);
    eth_msg[28..60].copy_from_slice(raw_hash.as_slice());
    keccak(&eth_msg)
}
