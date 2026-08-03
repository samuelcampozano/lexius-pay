#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
#![cfg_attr(not(any(feature = "export-abi", test)), no_std)]
#[cfg(not(any(feature = "export-abi", test)))]
extern crate alloc;
#[cfg(any(feature = "export-abi", test))]
extern crate std as alloc;


mod crypto;
mod types;

#[cfg(test)]
mod tests;

use alloc::vec;
use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, B256, U256, U8},
    prelude::*,
};



// Define ERC-20 Interface for external token contract calls
sol_interface! {
    interface IERC20 {
        function transfer(address recipient, uint256 amount) external returns (bool);
        function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    }
}

stylus_sdk::alloy_sol_types::sol! {
    #[derive(Debug)]
    event EscrowCreated(uint256 indexed escrow_id, address indexed buyer, address indexed seller, uint256 amount, bytes32 details_hash);
    #[derive(Debug)]
    event EscrowDeposited(uint256 indexed escrow_id, address indexed buyer, uint256 amount);
    #[derive(Debug)]
    event EscrowDisputed(uint256 indexed escrow_id, address indexed initiator);
    #[derive(Debug)]
    event EscrowResolved(uint256 indexed escrow_id, address indexed winner, address indexed oracle);
    #[derive(Debug)]
    event EscrowRefunded(uint256 indexed escrow_id, address indexed buyer);

    #[derive(Debug)]
    error Unauthorized();
    #[derive(Debug)]
    error InvalidState();
    #[derive(Debug)]
    error InvalidSignature();
    #[derive(Debug)]
    error TransferFailed();
    #[derive(Debug)]
    error InvalidAmount();
}

#[derive(SolidityError, Debug)]
pub enum LexiusEscrowError {
    Unauthorized(Unauthorized),
    InvalidState(InvalidState),
    InvalidSignature(InvalidSignature),
    TransferFailed(TransferFailed),
    InvalidAmount(InvalidAmount),
}

sol_storage! {
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

#[public]
impl LexiusEscrow {
    /// Initialize the contract with Oracle public address and USDC token address
    pub fn init(&mut self, oracle: Address, token: Address) -> Result<(), LexiusEscrowError> {
        if self.owner.get() != Address::ZERO {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }
        let sender = self.vm().msg_sender();
        self.owner.set(sender);
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
        let sender = self.vm().msg_sender();
        if sender != self.owner.get() {
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
        let sender = self.vm().msg_sender();
        if sender != self.owner.get() {
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

        self.vm().log(EscrowCreated {
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
        let escrow = self.escrows.get(escrow_id);
        let buyer = escrow.buyer.get();
        let amount = escrow.amount.get();
        let status = escrow.status.get();

        if status != U8::from(0) {
            return Err(LexiusEscrowError::InvalidState(InvalidState {}));
        }

        let sender = self.vm().msg_sender();
        if sender != buyer {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }

        let token_addr = self.token_address.get();
        let contract_addr = self.vm().contract_address();

        // Transfer ERC-20 tokens from buyer to escrow contract via transferFrom
        let token = IERC20::new(token_addr);
        let config = Call::new_mutating(self);
        let success = token
            .transfer_from(self.vm(), config, buyer, contract_addr, amount)
            .map_err(|_| LexiusEscrowError::TransferFailed(TransferFailed {}))?;

        if !success {
            return Err(LexiusEscrowError::TransferFailed(TransferFailed {}));
        }

        let mut escrow = self.escrows.setter(escrow_id);
        escrow.status.set(U8::from(1)); // Deposited

        self.vm().log(EscrowDeposited {
            escrow_id,
            buyer: sender,
            amount,
        });

        Ok(())
    }

    /// Buyer or Seller releases funds upon successful agreement
    pub fn release(&mut self, escrow_id: U256) -> Result<(), LexiusEscrowError> {
        let escrow = self.escrows.get(escrow_id);
        let buyer = escrow.buyer.get();
        let seller = escrow.seller.get();
        let amount = escrow.amount.get();
        let status = escrow.status.get();

        if status != U8::from(1) {
            return Err(LexiusEscrowError::InvalidState(InvalidState {}));
        }

        let sender = self.vm().msg_sender();
        if sender != buyer && sender != seller {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }

        let token_addr = self.token_address.get();
        let token = IERC20::new(token_addr);
        let config = Call::new_mutating(self);
        let success = token
            .transfer(self.vm(), config, seller, amount)
            .map_err(|_| LexiusEscrowError::TransferFailed(TransferFailed {}))?;

        if !success {
            return Err(LexiusEscrowError::TransferFailed(TransferFailed {}));
        }

        let mut escrow = self.escrows.setter(escrow_id);
        escrow.status.set(U8::from(3)); // Completed

        self.vm().log(EscrowResolved {
            escrow_id,
            winner: seller,
            oracle: sender,
        });

        Ok(())
    }

    /// Seller refunds buyer voluntarily
    pub fn refund(&mut self, escrow_id: U256) -> Result<(), LexiusEscrowError> {
        let escrow = self.escrows.get(escrow_id);
        let buyer = escrow.buyer.get();
        let seller = escrow.seller.get();
        let amount = escrow.amount.get();
        let status = escrow.status.get();

        if status != U8::from(1) {
            return Err(LexiusEscrowError::InvalidState(InvalidState {}));
        }

        let sender = self.vm().msg_sender();
        if sender != seller {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }

        let token_addr = self.token_address.get();
        let token = IERC20::new(token_addr);
        let config = Call::new_mutating(self);
        let success = token
            .transfer(self.vm(), config, buyer, amount)
            .map_err(|_| LexiusEscrowError::TransferFailed(TransferFailed {}))?;

        if !success {
            return Err(LexiusEscrowError::TransferFailed(TransferFailed {}));
        }

        let mut escrow = self.escrows.setter(escrow_id);
        escrow.status.set(U8::from(4)); // Refunded

        self.vm().log(EscrowRefunded { escrow_id, buyer });

        Ok(())
    }

    /// Either party raises a dispute
    pub fn raise_dispute(&mut self, escrow_id: U256) -> Result<(), LexiusEscrowError> {
        let escrow = self.escrows.get(escrow_id);
        let buyer = escrow.buyer.get();
        let seller = escrow.seller.get();
        let status = escrow.status.get();

        if status != U8::from(1) {
            return Err(LexiusEscrowError::InvalidState(InvalidState {}));
        }

        let sender = self.vm().msg_sender();
        if sender != buyer && sender != seller {
            return Err(LexiusEscrowError::Unauthorized(Unauthorized {}));
        }

        let mut escrow = self.escrows.setter(escrow_id);
        escrow.status.set(U8::from(2)); // Disputed

        self.vm().log(EscrowDisputed {
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
        let escrow = self.escrows.get(escrow_id);
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

        let oracle = self.oracle_address.get();
        let eth_hash = crypto::eth_signed_message_hash(escrow_id, winner);

        let recovered_oracle = crypto::ecrecover(self, eth_hash, v, r, s)
            .map_err(|_| LexiusEscrowError::InvalidSignature(InvalidSignature {}))?;

        if recovered_oracle != oracle {
            return Err(LexiusEscrowError::InvalidSignature(InvalidSignature {}));
        }

        let token_addr = self.token_address.get();
        let token = IERC20::new(token_addr);
        let config = Call::new_mutating(self);
        let success = token
            .transfer(self.vm(), config, winner, amount)
            .map_err(|_| LexiusEscrowError::TransferFailed(TransferFailed {}))?;

        if !success {
            return Err(LexiusEscrowError::TransferFailed(TransferFailed {}));
        }

        let mut escrow = self.escrows.setter(escrow_id);
        escrow.status.set(if winner == seller { U8::from(3) } else { U8::from(4) });

        self.vm().log(EscrowResolved {
            escrow_id,
            winner,
            oracle,
        });

        Ok(())
    }
}
