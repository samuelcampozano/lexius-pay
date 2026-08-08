import OpenAI from 'openai';

export interface DisputeEvidenceInput {
  escrowId: string;
  buyerAddress: string;
  sellerAddress: string;
  itemDescription: string;
  claimText: string;
  evidenceImageUrls: string[];
}

export interface AIVerdictResult {
  winnerAddress: string;
  reasoning: string;
  summary: string;
  confidenceScore: number;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY in environment variables');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Se ha agregado la Regla 1 para manejar la falta de imágenes sin romper el formato JSON
const SYSTEM_PROMPT = `You are an expert impartial AI Judicial Arbitrator for Web3 P2P Escrow transactions.
Your task is to analyze dispute claims, chat logs, OCR bank receipts, and event ticket images objectively.

Global & Regional Bank Recognition Capabilities:
1. You are trained to inspect financial receipts, bank vouchers, and mobile transfer screenshots from LatAm and Global providers:
   - Peru: Yape, Plin, BCP (Banco de Crédito), Interbank, BBVA Perú, Scotiabank.
   - Ecuador: Banco Pichincha (Deuna!), Banco Guayaquil, Produbanco, Banco del Pacífico.
   - Colombia: Nequi, Daviplata, Bancolombia, Banco de Bogotá, Movii.
   - USA & Global: Zelle, Venmo, Cash App, PayPal, Wise, Revolut, Stripe, Chase, Bank of America.
2. Analyze image authenticity: check for forged text, font mismatches, edited amounts, fake operation numbers, or barcode serial discrepancies.
3. If no images are provided, evaluate based on the textual claim facts provided.
4. Output Language: Write the "reason" field in the SAME language (Spanish or English) as the user's dispute claim text.

Output Rules:
- Respond ONLY with a valid single JSON object.
- The JSON object must contain exactly two fields: "winner" (string wallet address) and "reason" (string concise justification).

Example output:
{"winner":"0x1234...","reason":"GPT-4o OCR verified Yape receipt operation #849201. Amount S/180.00 matches transaction terms. Refund authorized."}`;

export async function evaluateDisputeWithAI(
  params: DisputeEvidenceInput
): Promise<AIVerdictResult> {
  
  // 1. Preparamos el contenido del usuario integrando texto e imágenes en el mismo array
  const userContent: any[] = [
    {
      type: 'input_text',
      text: `Escrow ID: ${params.escrowId}\nBuyer Address: ${params.buyerAddress}\nSeller Address: ${params.sellerAddress}\nItem Description: ${params.itemDescription}\nDispute Claim: ${params.claimText}\n\nEvaluate these facts and the evidence images, then return a strict JSON verdict with winner and reason only.`,
    },
  ];

  // Añadimos cada URL de evidencia como parte del contenido del mensaje
  params.evidenceImageUrls.forEach((url) => {
    userContent.push({
      type: 'input_image',
      image_url: url,
      detail: 'auto',
    });
  });

  // 2. Hacemos la llamada usando la API de Responses de OpenAI
  const response = await openai.responses.create({
    model: 'gpt-4o',
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
  });

  // 3. Obtenemos el texto plano de forma directa
  const rawOutput = response.output_text;

  if (!rawOutput) {
    throw new Error('OpenAI did not return a parsable text output');
  }

  // Limpiamos el string por si GPT añadió delimitadores de Markdown como ```json
  const trimmedOutput = rawOutput.trim();
  const jsonText = trimmedOutput.startsWith('{')
    ? trimmedOutput
    : trimmedOutput.substring(trimmedOutput.indexOf('{'));

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Unable to parse OpenAI response as JSON: ${error}`);
  }

  if (!parsed?.winner || !parsed?.reason) {
    throw new Error('OpenAI response JSON must contain winner and reason');
  }

  return {
    winnerAddress: parsed.winner as string,
    reasoning: parsed.reason as string,
    summary: `Decision rendered for escrow ${params.escrowId}`,
    confidenceScore: 0.92, // Valor estático por el momento
  };
}