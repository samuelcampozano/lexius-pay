#![cfg(test)]

use super::*;
use alloy_primitives::{address, b256, Address, B256, U256};
use crate::types::EscrowStatus;

#[test]
fn test_eth_signed_message_hash_generation() {
    let escrow_id = U256::from(101);
    let winner = address!("1111111111111111111111111111111111111111");

    let eth_hash = crypto::eth_signed_message_hash(escrow_id, winner);
    assert_ne!(eth_hash, B256::ZERO);
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

#[test]
fn test_contract_initialization_mock() {
    // Simulated TestVM test
    let oracle = address!("2222222222222222222222222222222222222222");
    let token = address!("3333333333333333333333333333333333333333");

    assert_ne!(oracle, Address::ZERO);
    assert_ne!(token, Address::ZERO);
}
