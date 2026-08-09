export type EscrowStatus = 'Pending' | 'Deposited' | 'Disputed' | 'Completed' | 'Refunded' | 'Cancelled';

export interface EscrowItem {
  id: string;
  buyer: string;
  seller: string;
  amount: string;
  description: string;
  status: EscrowStatus;
  createdAt: string;
  txHash?: string;
}

export interface DisputeVerdict {
  escrowId: string;
  winner: string;
  reasoning: string;
  summary: string;
  confidenceScore: number;
  fraudRiskFlag?: boolean;
  evidenceAuthenticityScore?: number;
  signature: string;
  v: number;
  r: string;
  s: string;
  oracleAddress: string;
  timestamp: string;
}
