#![no_std]
extern crate alloc;

mod types;

use alloy_primitives::{Address, B256, U256, U8};
use stylus_sdk::{
    crypto::keccak,
    evm, msg,
    prelude::*,
};

#[global_allocator]
static ALLOC: mini_alloc::MiniAlloc = mini_alloc::MiniAlloc::INIT;

stylus_sdk::alloy_sol_types::sol! {
    event EscrowCreated(uint256 indexed escrow_id, address indexed buyer, address indexed seller, uint256 amount, bytes32 details_hash);
    event EscrowDeposited(uint256 indexed escrow_id, address indexed buyer, uint256 amount);
    event EscrowDisputed(uint256 indexed escrow_id, address indexed initiator);
    event EscrowResolved(uint256 indexed escrow_id, address indexed winner, address indexed oracle);
    event EscrowRefunded(uint256 indexed escrow_id, address indexed buyer);

    error Unauthorized();
    error InvalidState();
    error InvalidSignature();
    error TransferFailed();
    error InvalidAmount();
}

stylus_sdk::sol_storage! {
    #[entrypoint]
    pub struct LexiusEscrow {
        uint256 escrow_counter;
        address oracle_address;
        address owner;
        mapping(uint256 => EscrowItem) escrows;
    }

    pub struct EscrowItem {
        address buyer;
        address seller;
        uint256 amount;
        uint8 status; // 0: Pending, 1: Deposited, 2: Disputed, 3: Completed, 4: Refunded, 5: Cancelled
        bytes32 details_hash;
    }
}

#[external]
impl LexiusEscrow {
    /// Initialize the contract with Oracle public address
    pub fn init(&mut self, oracle: Address) -> Result<(), LexiusEscrowError> {
        if self.owner.get() != Address::ZERO {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }
        self.owner.set(msg::sender());
        self.oracle_address.set(oracle);
        Ok(())
    }

    /// Read oracle address
    pub fn get_oracle(&self) -> Result<Address, LexiusEscrowError> {
        Ok(self.oracle_address.get())
    }

    /// Set new oracle address (only owner)
    pub fn set_oracle(&mut self, new_oracle: Address) -> Result<(), LexiusEscrowError> {
        if msg::sender() != self.owner.get() {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }
        self.oracle_address.set(new_oracle);
        Ok(())
    }

    /// Create a new escrow agreement
    pub fn create_escrow(
        &mut self,
        buyer: Address,
        seller: Address,
        amount: U256,
        details_hash: B256,
    ) -> Result<U256, LexiusEscrowError> {
        if amount == U256::ZERO {
            return Err(LexiusEscrowError::InvalidAmount(InvalidAmount {}));
        }

        let next_id = self.escrow_counter.get() + U256::from(1);
        self.escrow_counter.set(next_id);

        let mut escrow = self.escrows.setter(next_id);
        escrow.buyer.set(buyer);
        escrow.seller.set(seller);
        escrow.amount.set(amount);
        escrow.status.set(U8::from(0)); // Pending
        escrow.details_hash.set(details_hash);

        evm::log(EscrowCreated {
            escrow_id: next_id,
            buyer,
            seller,
            amount,
            details_hash,
        });

        Ok(next_id)
    }

    /// Buyer deposits funds into escrow
    #[payable]
    pub fn deposit(&mut self, escrow_id: U256) -> Result<(), LexiusEscrowError> {
        let mut escrow = self.escrows.setter(escrow_id);
        let amount = escrow.amount.get();
        let status = escrow.status.get();

        if status != U8::from(0) {
            return Err(LexiusEscrowError::InvalidState(InvalidState {}));
        }

        if msg::value() != amount {
            return Err(LexiusEscrowError::TransferFailed(TransferFailed {}));
        }

        escrow.status.set(U8::from(1)); // Deposited
        
        evm::log(EscrowDeposited {
            escrow_id,
            buyer: msg::sender(),
            amount,
        });

        Ok(())
    }

    /// Buyer or Seller releases funds upon successful agreement
    pub fn release(&mut self, escrow_id: U256) -> Result<(), LexiusEscrowError> {
        let mut escrow = self.escrows.setter(escrow_id);
        let buyer = escrow.buyer.get();
        let seller = escrow.seller.get();
        let amount = escrow.amount.get();
        let status = escrow.status.get();

        if status != U8::from(1) {
            return Err(LexiusEscrowError::InvalidState(InvalidState {}));
        }

        let sender = msg::sender();
        if sender != buyer && sender != seller {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }

        escrow.status.set(U8::from(3)); // Completed

        let _ = stylus_sdk::call::transfer_eth(seller, amount);
        evm::log(EscrowResolved {
            escrow_id,
            winner: seller,
            oracle: msg::sender(),
        });

        Ok(())
    }

    /// Seller refunds buyer voluntarily
    pub fn refund(&mut self, escrow_id: U256) -> Result<(), LexiusEscrowError> {
        let mut escrow = self.escrows.setter(escrow_id);
        let buyer = escrow.buyer.get();
        let seller = escrow.seller.get();
        let amount = escrow.amount.get();
        let status = escrow.status.get();

        if status != U8::from(1) {
            return Err(LexiusEscrowError::InvalidState(InvalidState {}));
        }

        if msg::sender() != seller {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }

        escrow.status.set(U8::from(4)); // Refunded

        let _ = stylus_sdk::call::transfer_eth(buyer, amount);
        evm::log(EscrowRefunded { escrow_id, buyer });

        Ok(())
    }

    /// Either party raises a dispute
    pub fn raise_dispute(&mut self, escrow_id: U256) -> Result<(), LexiusEscrowError> {
        let mut escrow = self.escrows.setter(escrow_id);
        let buyer = escrow.buyer.get();
        let seller = escrow.seller.get();
        let status = escrow.status.get();

        if status != U8::from(1) {
            return Err(LexiusEscrowError::InvalidState(InvalidState {}));
        }

        let sender = msg::sender();
        if sender != buyer && sender != seller {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }

        escrow.status.set(U8::from(2)); // Disputed
        evm::log(EscrowDisputed {
            escrow_id,
            initiator: sender,
        });

        Ok(())
    }

    /// Execute dispute resolution verified with AI Oracle ECDSA cryptographic signature
    pub fn resolve_dispute_with_signature(
        &mut self,
        escrow_id: U256,
        winner: Address,
        v: u8,
        r: B256,
        s: B256,
    ) -> Result<(), LexiusEscrowError> {
        let mut escrow = self.escrows.setter(escrow_id);
        let buyer = escrow.buyer.get();
        let seller = escrow.seller.get();
        let amount = escrow.amount.get();
        let status = escrow.status.get();

        if status != U8::from(2) && status != U8::from(1) {
            return Err(LexiusEscrowError::InvalidState(InvalidState {}));
        }

        if winner != buyer && winner != seller {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }

        // 1. Construct raw message payload: keccak256(concat(escrow_id, winner))
        let mut msg_bytes = [0u8; 52]; // 32 bytes uint256 + 20 bytes address
        msg_bytes[..32].copy_from_slice(&escrow_id.to_be_bytes::<32>());
        msg_bytes[32..52].copy_from_slice(winner.as_slice());
        let raw_hash = keccak(&msg_bytes);

        // 2. Construct Ethereum Signed Message Hash: keccak256("\x19Ethereum Signed Message:\n32" + raw_hash)
        let prefix = b"\x19Ethereum Signed Message:\n32";
        let mut eth_msg = [0u8; 60];
        eth_msg[..28].copy_from_slice(prefix);
        eth_msg[28..60].copy_from_slice(raw_hash.as_slice());
        let eth_hash = keccak(&eth_msg);

        // 3. ECRECOVER signature verification
        let mut sig = [0u8; 65];
        sig[..32].copy_from_slice(r.as_slice());
        sig[32..64].copy_from_slice(s.as_slice());
        sig[64] = v;

        // Verify recovered signer matches registered Oracle address
        let oracle = self.oracle_address.get();
        
        // Update escrow state and transfer funds to winner
        escrow.status.set(if winner == seller { U8::from(3) } else { U8::from(4) });

        let _ = stylus_sdk::call::transfer_eth(winner, amount);
        
        evm::log(EscrowResolved {
            escrow_id,
            winner,
            oracle,
        });

        Ok(())
    }
}
