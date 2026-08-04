#![cfg(test)]

use super::*;
use alloy_primitives::{address, b256, Address, B256, U256, U8};
use crate::types::EscrowStatus;

// ─────────────────────────────────────────────────────────────────────
// Test Constants
// ─────────────────────────────────────────────────────────────────────
const OWNER: Address = address!("0000000000000000000000000000000000000001");
const ORACLE: Address = address!("2364fdE9F7178A9697478b876663482736B4FA5c");
const TOKEN: Address = address!("0000000000000000000000000000000000000002");
const BUYER: Address = address!("00000000000000000000000000000000000000b0");
const SELLER: Address = address!("000000000000000000000000000000000000005e");
const STRANGER: Address = address!("0000000000000000000000000000000000000057");
const DETAILS_HASH: B256 = b256!("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");

// ═══════════════════════════════════════════════════════════════════
// 1. Escrow Status State Machine Tests
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_escrow_status_all_values() {
    assert_eq!(EscrowStatus::from(0u8), EscrowStatus::Pending);
    assert_eq!(EscrowStatus::from(1u8), EscrowStatus::Deposited);
    assert_eq!(EscrowStatus::from(2u8), EscrowStatus::Disputed);
    assert_eq!(EscrowStatus::from(3u8), EscrowStatus::Completed);
    assert_eq!(EscrowStatus::from(4u8), EscrowStatus::Refunded);
    assert_eq!(EscrowStatus::from(5u8), EscrowStatus::Cancelled);
}

#[test]
fn test_escrow_status_to_u8() {
    assert_eq!(U8::from(EscrowStatus::Pending as u8), U8::from(0));
    assert_eq!(U8::from(EscrowStatus::Deposited as u8), U8::from(1));
    assert_eq!(U8::from(EscrowStatus::Disputed as u8), U8::from(2));
    assert_eq!(U8::from(EscrowStatus::Completed as u8), U8::from(3));
    assert_eq!(U8::from(EscrowStatus::Refunded as u8), U8::from(4));
    assert_eq!(U8::from(EscrowStatus::Cancelled as u8), U8::from(5));
}

#[test]
fn test_escrow_status_unknown_defaults_to_cancelled() {
    assert_eq!(EscrowStatus::from(99u8), EscrowStatus::Cancelled);
    assert_eq!(EscrowStatus::from(255u8), EscrowStatus::Cancelled);
}

// ═══════════════════════════════════════════════════════════════════
// 2. Cryptographic Hashing & Signature Verification Tests
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_eth_signed_message_hash_deterministic() {
    let escrow_id = U256::from(1);
    let winner = BUYER;

    let hash1 = crypto::eth_signed_message_hash(escrow_id, winner);
    let hash2 = crypto::eth_signed_message_hash(escrow_id, winner);

    assert_ne!(hash1, B256::ZERO, "hash should not be zero");
    assert_eq!(hash1, hash2, "same inputs should produce same hash");
}

#[test]
fn test_eth_signed_message_hash_different_inputs() {
    let hash1 = crypto::eth_signed_message_hash(U256::from(1), BUYER);
    let hash2 = crypto::eth_signed_message_hash(U256::from(2), BUYER);
    let hash3 = crypto::eth_signed_message_hash(U256::from(1), SELLER);

    assert_ne!(hash1, hash2, "different escrow IDs should produce different hashes");
    assert_ne!(hash1, hash3, "different winners should produce different hashes");
}

// ═══════════════════════════════════════════════════════════════════
// 3. GCP AI Oracle Address & Constants Validation
// ═══════════════════════════════════════════════════════════════════

#[test]
fn test_gcp_ai_oracle_address_is_valid() {
    assert_ne!(ORACLE, Address::ZERO, "oracle address must not be zero");
    assert_eq!(
        ORACLE,
        address!("2364fdE9F7178A9697478b876663482736B4FA5c"),
        "oracle address must match GCP AI Oracle"
    );
}

#[test]
fn test_test_addresses_unique() {
    assert_ne!(BUYER, SELLER);
    assert_ne!(BUYER, OWNER);
    assert_ne!(SELLER, ORACLE);
    assert_ne!(TOKEN, Address::ZERO);
}
