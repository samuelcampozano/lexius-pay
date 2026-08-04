use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{address, Address, B256, U256},
    call::call,
    crypto::keccak,
    prelude::*,
};

const ECRECOVER: Address = address!("0000000000000000000000000000000000000001");

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

/// Call EVM ECRECOVER precompile at address 0x01 using Stylus call
pub fn ecrecover(storage: &mut (impl TopLevelStorage + HostAccess), hash: B256, v: u8, r: B256, s: B256) -> Result<Address, Vec<u8>> {
    let mut input = [0u8; 128];
    input[0..32].copy_from_slice(hash.as_slice());
    input[63] = if v < 27 { v + 27 } else { v };
    input[64..96].copy_from_slice(r.as_slice());
    input[96..128].copy_from_slice(s.as_slice());

    let config = Call::new_mutating(storage);
    let res = call(storage.vm(), config, ECRECOVER, &input)?;
    if res.len() < 32 {
        return Err(alloc::vec![]);
    }
    let mut address_bytes = [0u8; 20];
    address_bytes.copy_from_slice(&res[12..32]);
    Ok(Address::from(address_bytes))
}
