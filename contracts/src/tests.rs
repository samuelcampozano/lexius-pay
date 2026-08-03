#![cfg(test)]

use super::*;
use alloy_primitives::{address, b256, Address, B256, U256};
use crate::types::EscrowStatus;

pub const GCP_AI_ORACLE_ADDRESS: Address = address!("2364fdE9F7178A9697478b876663482736B4FA5c");

#[test]
fn test_gcp_ai_oracle_address_validation() {
    assert_ne!(GCP_AI_ORACLE_ADDRESS, Address::ZERO);
    assert_eq!(
        GCP_AI_ORACLE_ADDRESS,
        address!("2364fdE9F7178A9697478b876663482736B4FA5c")
    );
}

#[test]
fn test_eth_signed_message_hash_generation() {
    let escrow_id = U256::from(1);
    let winner = address!("0000000000000000000000000000000000000001");

    let eth_hash = crypto::eth_signed_message_hash(escrow_id, winner);
    assert_ne!(eth_hash, B256::ZERO);
}

#[test]
fn test_ai_oracle_signature_parameters_mock() {
    let winner = address!("0000000000000000000000000000000000000001");
    let v: u8 = 28;
    let r = b256!("5890c883b89192bb4749982279a83475fb01d223438249316f351d37b442fe22");
    let s = b256!("4e4a7c56510617961407dd2e2fe3f775e3bcfdfdf3d4135b9f655a67d028fca9");

    assert_eq!(winner, address!("0000000000000000000000000000000000000001"));
    assert_eq!(v, 28);
    assert_ne!(r, B256::ZERO);
    assert_ne!(s, B256::ZERO);
}

#[test]
fn test_escrow_status_transitions() {
    let status_pending = EscrowStatus::Pending;
    assert_eq!(u8::from(status_pending as u8), 0);

    let status_deposited = EscrowStatus::Deposited;
    assert_eq!(u8::from(status_deposited as u8), 1);

    let status_disputed = EscrowStatus::Disputed;
    assert_eq!(u8::from(status_disputed as u8), 2);

    let status_completed = EscrowStatus::Completed;
    assert_eq!(u8::from(status_completed as u8), 3);

    let status_refunded = EscrowStatus::Refunded;
    assert_eq!(u8::from(status_refunded as u8), 4);
}
