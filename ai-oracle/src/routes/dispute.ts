import { Router, Request, Response } from 'express';
import { evaluateDisputeWithAI } from '../services/ai';
import { signVerdict } from '../utils/signer';

const router = Router();

/**
 * POST /api/dispute/resolve
 * 
 * Full E2E dispute resolution endpoint:
 * 1. Receives escrow dispute data + GCS evidence image URLs
 * 2. Calls GPT-4o Vision to analyze evidence and determine winner
 * 3. Signs the verdict with the Oracle's ECDSA private key (EIP-191 compatible)
 * 4. Returns the signed verdict ready for on-chain execution via
 *    resolve_dispute_with_signature(escrowId, winner, v, r, s)
 */
router.post('/resolve', async (req: Request, res: Response) => {
  try {
    const {
      escrowId,
      buyerAddress,
      sellerAddress,
      itemDescription,
      claimText,
      evidenceImageUrls,
      sellerClaimText,
      sellerEvidenceImageUrls,
    } = req.body;

    // Validate required parameters
    if (!escrowId || !buyerAddress || !sellerAddress || !claimText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: escrowId, buyerAddress, sellerAddress, claimText',
      });
    }

    // Normalize evidence URLs into arrays
    const resolvedBuyerEvidence = Array.isArray(evidenceImageUrls)
      ? evidenceImageUrls
      : evidenceImageUrls
      ? [evidenceImageUrls]
      : [];

    const resolvedSellerEvidence = Array.isArray(sellerEvidenceImageUrls)
      ? sellerEvidenceImageUrls
      : sellerEvidenceImageUrls
      ? [sellerEvidenceImageUrls]
      : [];

    console.log(`[AI Oracle] Resolving dispute for Escrow #${escrowId}`);
    console.log(`[AI Oracle] Buyer: ${buyerAddress} (${resolvedBuyerEvidence.length} buyer images)`);
    console.log(`[AI Oracle] Seller: ${sellerAddress} (${resolvedSellerEvidence.length} seller images)`);

    // Step 1: Call GPT-4o Vision to analyze the bilateral dispute evidence
    const aiVerdict = await evaluateDisputeWithAI({
      escrowId,
      buyerAddress,
      sellerAddress,
      itemDescription: itemDescription || 'P2P Deal',
      claimText,
      evidenceImageUrls: resolvedBuyerEvidence,
      sellerClaimText,
      sellerEvidenceImageUrls: resolvedSellerEvidence,
    });

    console.log(`[AI Oracle] AI verdict: Winner = ${aiVerdict.winnerAddress} | FraudRisk = ${aiVerdict.fraudRiskFlag}`);

    // Step 2: Sign the verdict with Oracle's private key (EIP-191 compatible with Stylus ecrecover)
    const signedPayload = await signVerdict(escrowId, aiVerdict.winnerAddress);

    console.log(`[AI Oracle] Signature generated. Oracle address: ${signedPayload.oracleAddress}`);

    // Step 3: Automatically notify Telegram chat if linked
    try {
      const { escrowCardStore, getBot } = await import('../services/telegram');
      const stored = escrowCardStore.get(String(escrowId));
      if (stored) {
        const b = getBot();
        const isBuyerWinner = aiVerdict.winnerAddress.toLowerCase() === buyerAddress.toLowerCase();
        const winnerLabel = isBuyerWinner ? 'Comprador' : 'Vendedor';
        const text = [
          `👨‍⚖️ *Veredicto Final del Oráculo IA Lexius*`,
          ``,
          `📋 *Acuerdo P2P #${escrowId}*`,
          `🏆 *Ganador:* ${winnerLabel} (\`${aiVerdict.winnerAddress.slice(0, 6)}...${aiVerdict.winnerAddress.slice(-4)}\`)`,
          `🛡️ *Nivel de Riesgo:* ${aiVerdict.fraudRiskFlag ? '⚠️ Alto' : '✅ Seguro'}`,
          ``,
          `📝 *Fundamentación del Agente IA:*`,
          `_${aiVerdict.summary || aiVerdict.reasoning}_`,
        ].join('\n');
        await b.telegram.sendMessage(stored.chatId, text, { parse_mode: 'Markdown' });
      }
    } catch (tgErr) {
      console.warn('[AI Oracle] Telegram verdict notification skipped:', tgErr);
    }

    // Step 4: Return structured response matching the expected format
    return res.status(200).json({
      success: true,
      winner: aiVerdict.winnerAddress,
      reason: aiVerdict.reasoning,
      v: signedPayload.v,
      r: signedPayload.r,
      s: signedPayload.s,
      signature: signedPayload.signature,
      // Additional anti-fraud metadata
      escrowId,
      confidenceScore: aiVerdict.confidenceScore,
      fraudRiskFlag: aiVerdict.fraudRiskFlag,
      evidenceAuthenticityScore: aiVerdict.evidenceAuthenticityScore,
      summary: aiVerdict.summary,
      oracleAddress: signedPayload.oracleAddress,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[AI Oracle Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve dispute',
      details: error.message || String(error),
    });
  }
});

export interface DisputeRecord {
  escrowId: string;
  isDisputed: boolean;
  status: 'disputed' | 'completed' | 'pending';
  claimText?: string;
  proofUrl?: string;
  sellerClaimText?: string;
  sellerProofUrl?: string;
  updatedAt: string;
}

export const disputeStore = new Map<string, DisputeRecord>();

/**
 * GET /api/dispute/status?escrowId=35
 * Returns real-time dispute status and evidence across devices
 */
router.get('/status', (req: Request, res: Response) => {
  const escrowId = String(req.query.escrowId || '');
  if (!escrowId) {
    return res.status(400).json({ success: false, error: 'escrowId query parameter required' });
  }

  const record = disputeStore.get(escrowId);
  if (!record) {
    return res.status(200).json({
      success: true,
      escrowId,
      isDisputed: false,
      status: 'pending',
    });
  }

  return res.status(200).json({
    success: true,
    escrowId,
    isDisputed: record.isDisputed,
    status: record.status,
    dispute: record,
  });
});

/**
 * POST /api/dispute/save-evidence
 * Saves buyer or seller evidence on backend and alerts Telegram
 */
router.post('/save-evidence', async (req: Request, res: Response) => {
  try {
    const { escrowId, claimText, proofUrl, sellerClaimText, sellerProofUrl, role } = req.body;
    if (!escrowId) {
      return res.status(400).json({ success: false, error: 'escrowId required' });
    }

    const existing = disputeStore.get(String(escrowId)) || {
      escrowId: String(escrowId),
      isDisputed: true,
      status: 'disputed',
      updatedAt: new Date().toISOString(),
    };

    const updatedRecord: DisputeRecord = {
      ...existing,
      isDisputed: true,
      status: 'disputed',
      claimText: claimText !== undefined ? claimText : existing.claimText,
      proofUrl: proofUrl !== undefined ? proofUrl : existing.proofUrl,
      sellerClaimText: sellerClaimText !== undefined ? sellerClaimText : existing.sellerClaimText,
      sellerProofUrl: sellerProofUrl !== undefined ? sellerProofUrl : existing.sellerProofUrl,
      updatedAt: new Date().toISOString(),
    };

    disputeStore.set(String(escrowId), updatedRecord);

    // Notify Telegram card if available
    try {
      const { escrowCardStore, updateEscrowCard } = await import('../services/telegram');
      const stored = escrowCardStore.get(String(escrowId));
      if (stored) {
        await updateEscrowCard({
          chatId: stored.chatId,
          messageId: stored.messageId,
          escrowId: String(escrowId),
          newStatus: 'disputed',
          amount: '10',
          description: 'Escrow Agreement',
        });
      }
    } catch (tgErr) {
      console.warn('[AI Oracle] Save evidence TG notify skipped:', tgErr);
    }

    return res.status(200).json({
      success: true,
      escrowId,
      record: updatedRecord,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
