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
    } = req.body;

    // Validate required parameters
    if (!escrowId || !buyerAddress || !sellerAddress || !claimText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: escrowId, buyerAddress, sellerAddress, claimText',
      });
    }

    // Normalize evidence URLs into an array
    const resolvedEvidence = Array.isArray(evidenceImageUrls)
      ? evidenceImageUrls
      : evidenceImageUrls
      ? [evidenceImageUrls]
      : [];

    console.log(`[AI Oracle] Resolving dispute for Escrow #${escrowId}`);
    console.log(`[AI Oracle] Buyer: ${buyerAddress}`);
    console.log(`[AI Oracle] Seller: ${sellerAddress}`);
    console.log(`[AI Oracle] Evidence URLs: ${resolvedEvidence.length} image(s)`);

    // Step 1: Call GPT-4o Vision to analyze the dispute
    const aiVerdict = await evaluateDisputeWithAI({
      escrowId,
      buyerAddress,
      sellerAddress,
      itemDescription: itemDescription || 'P2P Deal',
      claimText,
      evidenceImageUrls: resolvedEvidence,
    });

    console.log(`[AI Oracle] AI verdict: Winner = ${aiVerdict.winnerAddress}`);

    // Step 2: Sign the verdict with Oracle's private key (EIP-191 compatible with Stylus ecrecover)
    const signedPayload = await signVerdict(escrowId, aiVerdict.winnerAddress);

    console.log(`[AI Oracle] Signature generated. Oracle address: ${signedPayload.oracleAddress}`);

    // Step 3: Return structured response matching the expected format
    return res.status(200).json({
      success: true,
      winner: aiVerdict.winnerAddress,
      reason: aiVerdict.reasoning,
      v: signedPayload.v,
      r: signedPayload.r,
      s: signedPayload.s,
      signature: signedPayload.signature,
      // Additional metadata
      escrowId,
      confidenceScore: aiVerdict.confidenceScore,
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

export default router;
