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
      proofImageUrl,
    } = req.body;

    if (!escrowId || !buyerAddress || !sellerAddress || !claimText) {
      return res.status(400).json({
        error: 'Missing required parameters: escrowId, buyerAddress, sellerAddress, claimText',
      });
    }

    const oraclePrivateKey =
      process.env.ORACLE_PRIVATE_KEY ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

    console.log(`[AI Oracle] Evaluating dispute for Escrow #${escrowId}...`);

    // 1. Run GPT-4o Vision evaluation
    const aiVerdict = await evaluateDisputeWithAI({
      escrowId,
      buyerAddress,
      sellerAddress,
      itemDescription: itemDescription || 'P2P Deal',
      claimText,
      proofImageUrl,
    });

    // 2. Sign verdict hash with Oracle Private Key
    const signedPayload = await signDisputeVerdict(
      escrowId,
      aiVerdict.winnerAddress,
      oraclePrivateKey
    );

    console.log(`[AI Oracle] Verdict rendered! Winner: ${aiVerdict.winnerAddress}`);

    return res.json({
      success: true,
      escrowId,
      winner: aiVerdict.winnerAddress,
      reasoning: aiVerdict.reasoning,
      summary: aiVerdict.summary,
      confidenceScore: aiVerdict.confidenceScore,
      signature: signedPayload.signature,
      v: signedPayload.v,
      r: signedPayload.r,
      s: signedPayload.s,
      oracleAddress: signedPayload.oracleAddress,
      timestamp: new Date().toISOString(),
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
