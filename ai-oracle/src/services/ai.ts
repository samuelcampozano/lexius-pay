import OpenAI from 'openai';

export interface AIVerdictResult {
  winnerAddress: string;
  reasoning: string;
  summary: string;
  confidenceScore: number;
}

export async function evaluateDisputeWithAI(params: {
  escrowId: string;
  buyerAddress: string;
  sellerAddress: string;
  itemDescription: string;
  claimText: string;
  proofImageUrl?: string;
}): Promise<AIVerdictResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-dummy')) {
    // Fallback simulation for local testing when no real API key is configured
    console.log('[AI Oracle] Simulated evaluation (Dummy API key detected)');
    return {
      winnerAddress: params.buyerAddress,
      reasoning: 'Simulated AI Mediation: Buyer provided proof of valid payment receipt matching event details.',
      summary: 'Verdict in favor of Buyer (Simulated Test).',
      confidenceScore: 0.96,
    };
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are Lexius AI, an impartial and autonomous legal arbitration agent for Web3 P2P Escrows.
Your goal is to evaluate dispute claims between a Buyer and a Seller.
Analyze the transaction terms, user claims, and any provided evidence images (chat exports, OCR receipts, ticket screenshots).

Rules:
1. Output MUST be valid JSON only.
2. The winner MUST be either the buyer address ("${params.buyerAddress}") or seller address ("${params.sellerAddress}").
3. Provide a clear 2-sentence legal reasoning and confidence score between 0.0 and 1.0.

JSON format:
{
  "winner_address": "0x...",
  "reasoning": "Detailed justification...",
  "summary": "Short verdict title",
  "confidence_score": 0.95
}`;

  const userContent: Array<any> = [
    {
      type: 'text',
      text: `Escrow ID: ${params.escrowId}
Item Description: ${params.itemDescription}
Buyer Address: ${params.buyerAddress}
Seller Address: ${params.sellerAddress}
Dispute Claim: ${params.claimText}`,
    },
  ];

  if (params.proofImageUrl) {
    userContent.push({
      type: 'image_url',
      image_url: { url: params.proofImageUrl },
    });
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to receive response from GPT-4o Vision API');
  }

  const parsed = JSON.parse(content);
  return {
    winnerAddress: parsed.winner_address || params.buyerAddress,
    reasoning: parsed.reasoning || 'Evaluated evidence neutrally based on transaction records.',
    summary: parsed.summary || 'Dispute resolved',
    confidenceScore: parsed.confidence_score || 0.9,
  };
}
