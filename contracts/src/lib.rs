#![no_std]
extern crate alloc;

mod crypto;
mod types;

#[cfg(test)]
mod tests;

use alloy_primitives::{Address, B256, U256, U8};
use stylus_sdk::{
    contract, evm, msg,
    prelude::*,
};

#[global_allocator]
static ALLOC: mini_alloc::MiniAlloc = mini_alloc::MiniAlloc::INIT;

// Define ERC-20 Interface for external token contract calls
stylus_sdk::sol_interface! {
    interface IERC20 {
        function transfer(address recipient, uint256 amount) external returns (bool);
        function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    }
}

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
        address token_address;
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
    /// Initialize the contract with Oracle public address and USDC token address
    pub fn init(&mut self, oracle: Address, token: Address) -> Result<(), LexiusEscrowError> {
        if self.owner.get() != Address::ZERO {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }
        self.owner.set(msg::sender());
        self.oracle_address.set(oracle);
        self.token_address.set(token);
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

    /// Read USDC token address
    pub fn get_token(&self) -> Result<Address, LexiusEscrowError> {
        Ok(self.token_address.get())
    }

    /// Set new token address (only owner)
    pub fn set_token(&mut self, new_token: Address) -> Result<(), LexiusEscrowError> {
        if msg::sender() != self.owner.get() {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }
        self.token_address.set(new_token);
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

    /// Buyer deposits ERC-20 (USDC) funds into escrow
    pub fn deposit(&mut self, escrow_id: U256) -> Result<(), LexiusEscrowError> {
        let mut escrow = self.escrows.setter(escrow_id);
        let buyer = escrow.buyer.get();
        let amount = escrow.amount.get();
        let status = escrow.status.get();

        if status != U8::from(0) {
            return Err(LexiusEscrowError::InvalidState(InvalidState {}));
        }

        let sender = msg::sender();
        if sender != buyer {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }

        escrow.status.set(U8::from(1)); // Deposited

        // Transfer ERC-20 tokens from buyer to escrow contract via transferFrom
        let token = IERC20::new(self.token_address.get());
        let config = stylus_sdk::call::Call::new_in(self);
        let success = token
            .transfer_from(config, buyer, contract::address(), amount)
            .map_err(|_| LexiusEscrowError::TransferFailed(TransferFailed {}))?;

        if !success {
            return Err(LexiusEscrowError::TransferFailed(TransferFailed {}));
        }

        evm::log(EscrowDeposited {
            escrow_id,
            buyer: sender,
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

        // Transfer ERC-20 tokens to seller
        let token = IERC20::new(self.token_address.get());
        let config = stylus_sdk::call::Call::new_in(self);
        let success = token
            .transfer(config, seller, amount)
            .map_err(|_| LexiusEscrowError::TransferFailed(TransferFailed {}))?;

        if !success {
            return Err(LexiusEscrowError::TransferFailed(TransferFailed {}));
        }

        evm::log(EscrowResolved {
            escrow_id,
            winner: seller,
            oracle: sender,
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

        // Transfer ERC-20 tokens back to buyer
        let token = IERC20::new(self.token_address.get());
        let config = stylus_sdk::call::Call::new_in(self);
        let success = token
            .transfer(config, buyer, amount)
            .map_err(|_| LexiusEscrowError::TransferFailed(TransferFailed {}))?;

        if !success {
            return Err(LexiusEscrowError::TransferFailed(TransferFailed {}));
        }

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

        // 1. Construct Ethereum Signed Message Hash
        let eth_hash = crypto::eth_signed_message_hash(escrow_id, winner);

        // 2. Format 65-byte ECDSA signature: r (32) + s (32) + v (1)
        let mut sig = [0u8; 65];
        sig[..32].copy_from_slice(r.as_slice());
        sig[32..64].copy_from_slice(s.as_slice());
        sig[64] = if v < 27 { v + 27 } else { v };

        // 3. ECRECOVER signature verification using Stylus host precompile
        let recovered_oracle = stylus_sdk::crypto::ec_recover(&eth_hash.0, &sig)
            .map_err(|_| LexiusEscrowError::InvalidSignature(InvalidSignature {}))?;

        let oracle = self.oracle_address.get();
        if recovered_oracle != oracle {
            return Err(LexiusEscrowError::InvalidSignature(InvalidSignature {}));
        }

        // 4. Update escrow state and transfer tokens to winner
        escrow.status.set(if winner == seller { U8::from(3) } else { U8::from(4) });

        let token = IERC20::new(self.token_address.get());
        let config = stylus_sdk::call::Call::new_in(self);
        let success = token
            .transfer(config, winner, amount)
            .map_err(|_| LexiusEscrowError::TransferFailed(TransferFailed {}))?;

        if !success {
            return Err(LexiusEscrowError::TransferFailed(TransferFailed {}));
        }

        evm::log(EscrowResolved {
            escrow_id,
            winner,
            oracle,
        });

        Ok(())
    }
}
