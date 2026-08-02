import { AIVerdictResult } from '../services/ai';
import { SignedVerdict } from './signer';

export function formatDisputeResponse(aiVerdict: AIVerdictResult, signedVerdict: SignedVerdict) {
  return {
    success: true,
    escrowId: signedVerdict.escrowId,
    winner: aiVerdict.winnerAddress,
    reasoning: aiVerdict.reasoning,
    summary: aiVerdict.summary,
    confidenceScore: aiVerdict.confidenceScore,
    signature: signedVerdict.signature,
    v: signedVerdict.v,
    r: signedVerdict.r,
    s: signedVerdict.s,
    oracleAddress: signedVerdict.oracleAddress,
    timestamp: new Date().toISOString(),
  };
}
