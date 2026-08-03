import { Router, Request, Response } from 'express';
import { evaluateDisputeWithAI } from '../services/ai';
import { signDisputeVerdict } from '../utils/signer';

const router = Router();

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

    if (!escrowId || !buyerAddress || !sellerAddress || !claimText) {
      return res.status(400).json({
        error: 'Missing required parameters: escrowId, buyerAddress, sellerAddress, claimText',
      });
    }

    const resolvedEvidence = Array.isArray(evidenceImageUrls)
      ? evidenceImageUrls
      : evidenceImageUrls
      ? [evidenceImageUrls]
      : [];

    const aiVerdict = await evaluateDisputeWithAI({
      escrowId,
      buyerAddress,
      sellerAddress,
      itemDescription: itemDescription || 'P2P Deal',
      claimText,
      evidenceImageUrls: resolvedEvidence,
    });

    const oraclePrivateKey =
      process.env.ORACLE_PRIVATE_KEY ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

    const signedPayload = await signDisputeVerdict(
      escrowId,
      aiVerdict.winnerAddress,
      oraclePrivateKey
    );

    return res.status(200).json({
      winner: aiVerdict.winnerAddress,
      reason: aiVerdict.reasoning,
      signature: signedPayload.signature,
      v: signedPayload.v,
      r: signedPayload.r,
      s: signedPayload.s,
    });
  } catch (error: any) {
    console.error('[AI Oracle Error]', error);
    return res.status(500).json({
      error: 'Failed to resolve dispute',
      details: error.message || String(error),
    });
  }
});

export default router;
