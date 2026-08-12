import OpenAI from 'openai';

export interface DisputeEvidenceInput {
  escrowId: string;
  buyerAddress: string;
  sellerAddress: string;
  itemDescription: string;
  claimText: string;
  evidenceImageUrls: string[];
  sellerClaimText?: string;
  sellerEvidenceImageUrls?: string[];
}

export interface AIVerdictResult {
  winnerAddress: string;
  reasoning: string;
  summary: string;
  confidenceScore: number;
  fraudRiskFlag: boolean;
  evidenceAuthenticityScore: number;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY in environment variables');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert impartial AI Judicial Arbitrator for Web3 P2P Escrow transactions.
Your task is to analyze dispute claims, chat logs, courier tracking receipts, and physical item photos objectively using a strict Bilateral Evidence Protocol.

Judicial Rules & Anti-Fraud Protocols:
1. Bilateral Burden of Proof & Cross-Examination:
   - Evaluate BOTH Buyer's claim + evidence AND Seller's dispatch proof + tracking receipts.
   - Compare Buyer's item photos against Seller's dispatch/package photos.

2. Contextual Packaging & Waybill Requirement (Physical Goods):
   - For physical items or shipped merchandise, an isolated photo of an object (e.g. flowers, electronics, clothes) without courier packaging, shipping label, waybill, or tracking box is UNCONTEXTUAL and CANNOT serve as proof of seller delivery tampering.
   - If Seller provides valid postal dispatch proof / shipping label with matching buyer address, and Buyer only submits an uncontextual photo of a different item without packaging/label, rule in favor of the Seller due to insufficient contextual proof of tampering.

3. Anti-Fraud & Stock Photo Detection:
   - Inspect images for stock photo characteristics, watermarks, internet catalog framing, studio lighting artifacts, or isolated object snapshots.
   - If an image exhibits stock photo traits or lacks real-world contextual unboxing/package labels, flag "fraudRiskFlag": true and lower "evidenceAuthenticityScore".

4. Financial Receipts & Tickets Recognition:
   - LatAm & Global bank vouchers (Yape, Plin, BCP, Interbank, Nequi, Daviplata, Zelle, Venmo, PayPal, Wise, etc.).
   - Check for forged fonts, edited amounts, fake operation numbers, or barcode serial mismatches.

5. Rich Explainability & Output Language:
   - Write the "reason" field in a highly detailed, professional, smart, and explainable format in the SAME language (Spanish or English) as the dispute claim text.
   - Structure the "reason" into 3 clear sections:
     a) 🔍 [Inspección Visual & Multiespectral OCR / Visual Inspection]: Specific visual details observed in photos or documents.
     b) 📜 [Protocolo Bi-lateral & Regla Anti-Fraude / Bilateral Evaluation]: How claim vs dispatch proof was weighed.
     c) 🏛️ [Veredicto Judicial & Ejecución Stylus / Judicial Verdict]: The final legal ruling authorizing Payout Release or Full Refund.

Output Format Rules:
- Respond ONLY with a valid single JSON object containing:
  - "winner": (string wallet address of the winner: buyerAddress or sellerAddress)
  - "reason": (string rich, highly explainable judicial reasoning formatted with 🔍, 📜, 🏛️ emojis and structured analysis)
  - "confidenceScore": (number between 0.0 and 1.0)
  - "fraudRiskFlag": (boolean: true if suspicious stock photo or uncontextual claim detected, false otherwise)
  - "evidenceAuthenticityScore": (number between 0.0 and 1.0 assessing evidence credibility)

Example JSON Output:
{"winner":"0x71C7656EC7ab88b098defB751B7401B5f6d8976F","reason":"🔍 Inspección Visual & OCR: Se verificó la guía de despacho de Olva Courier #74819 con etiqueta de envío rotulada al destino del comprador. La foto adjuntada por el comprador muestra un producto aislado sin embalaje del envío ni código postal. 📜 Protocolo Bi-lateral de Carga de la Prueba: Bajo la Regla Anti-Fraude de Empaque Contextual, las imágenes sin embalaje de transporte no constituyen prueba fehaciente de manipulación en tránsito por el vendedor. 🏛️ Veredicto Judicial Stylus: Se desestima el reclamo por falta de contexto postal y se autoriza la LIBERACIÓN DE FONDOS al Vendedor.","confidenceScore":0.96,"fraudRiskFlag":true,"evidenceAuthenticityScore":0.35}`;

export async function evaluateDisputeWithAI(
  params: DisputeEvidenceInput
): Promise<AIVerdictResult> {
  
  const buyerImages = params.evidenceImageUrls || [];
  const sellerImages = params.sellerEvidenceImageUrls || [];

  const userPromptText = [
    `Escrow ID: #${params.escrowId}`,
    `Buyer Address: ${params.buyerAddress}`,
    `Seller Address: ${params.sellerAddress}`,
    `Item Description: ${params.itemDescription}`,
    ``,
    `--- BUYER CLAIM & EVIDENCE ---`,
    `Buyer Claim Text: ${params.claimText}`,
    `Buyer Images Attached: ${buyerImages.length} image(s)`,
    ``,
    `--- SELLER DISPATCH PROOF & EVIDENCE ---`,
    `Seller Dispatch Claim: ${params.sellerClaimText || 'Seller states item was dispatched per agreement.'}`,
    `Seller Images Attached: ${sellerImages.length} image(s)`,
    ``,
    `Evaluate both claims and evidence using the Contextual Packaging Rule and Stock Photo Anti-Fraud Protocol. Return the required JSON verdict.`
  ].join('\n');

  const userContent: any[] = [
    {
      type: 'input_text',
      text: userPromptText,
    },
  ];

  // Add Buyer evidence images
  buyerImages.forEach((url, i) => {
    userContent.push({
      type: 'input_text',
      text: `[Buyer Evidence Image #${i + 1}]`,
    });
    userContent.push({
      type: 'input_image',
      image_url: url,
      detail: 'auto',
    });
  });

  // Add Seller evidence images
  sellerImages.forEach((url, i) => {
    userContent.push({
      type: 'input_text',
      text: `[Seller Dispatch Evidence Image #${i + 1}]`,
    });
    userContent.push({
      type: 'input_image',
      image_url: url,
      detail: 'auto',
    });
  });

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

  const rawOutput = response.output_text;

  if (!rawOutput) {
    throw new Error('OpenAI did not return a parsable text output');
  }

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
    summary: `Decision rendered for escrow #${params.escrowId}`,
    confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
    fraudRiskFlag: Boolean(parsed.fraudRiskFlag),
    evidenceAuthenticityScore: typeof parsed.evidenceAuthenticityScore === 'number' ? parsed.evidenceAuthenticityScore : 0.90,
  };
}