use stylus_sdk::alloy_primitives::U8;

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    Pending = 0,   // Escrow created, awaiting buyer deposit
    Deposited = 1, // Funds deposited and locked
    Disputed = 2,  // Dispute opened, awaiting AI Oracle verdict
    Completed = 3, // Funds released to seller
    Refunded = 4,  // Funds refunded to buyer
    Cancelled = 5, // Cancelled before deposit
}

impl From<u8> for EscrowStatus {
    fn from(value: u8) -> Self {
        match value {
            0 => EscrowStatus::Pending,
            1 => EscrowStatus::Deposited,
            2 => EscrowStatus::Disputed,
            3 => EscrowStatus::Completed,
            4 => EscrowStatus::Refunded,
            _ => EscrowStatus::Cancelled,
        }
    }
}

impl From<EscrowStatus> for U8 {
    fn from(status: EscrowStatus) -> Self {
        U8::from(status as u8)
    }
}
