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
const SYSTEM_PROMPT = `You are an impartial judge for Web3 escrow disputes. Analyze the dispute description and evidence images objectively.

Rules:
1. If no images are provided, base your decision solely on the text claims. Do not apologize or state that images are missing.
2. Respond with valid JSON only.
3. The response must be a single JSON object with exactly two fields: winner and reason.
4. winner must be the wallet address of the winning party.
5. reason must be a concise justification for the decision.
6. Do not include any additional text, markdown, or explanation outside the JSON object.

Example output:
{"winner":"0x1234...","reason":"Based on the claims..."}`;

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