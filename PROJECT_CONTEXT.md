# 🚀 MASTER PROJECT CONTEXT: LEXIUS PAY

---

## 📌 1. INFORMACIÓN DEL PROYECTO Y OBJETIVOS

* **Nombre del Proyecto:** Lexius Pay (`lexius-pay`)
* **Tagline:** "Escrow P2P descentralizado por links con mediación de disputas autónoma por IA en Arbitrum Stylus."
* **Evento / Hackathon:** ETH Lima Hackathon 2026 (31 de julio al 12 de agosto de 2026).
* **Tracks y Bounties Objetivo:** 
  1. **Arbitrum Stylus Bounty** (Contratos inteligentes en Rust compilados a WebAssembly/WASM).
  2. **AI Agents Track** (Resolución autónoma e imparcial de disputas con visión multimodal).
  3. **Consumer & Social Use Cases** (Links de pago integrados en Telegram/WhatsApp con UX Web2).
* **Equipo:** 3 Integrantes.

---

## 💡 2. EL PROBLEMA Y LA SOLUCIÓN

### El Problema:
El comercio P2P en redes sociales (Telegram, WhatsApp, Facebook Marketplace) carece de confianza. Los sistemas de Escrow tradicionales requieren intermediarios humanos lentos y costosos. Además, la fricción de las wallets Web3 aleja al usuario común.

### La Solución (Lexius Pay):
1. **Generación de Link en 10s:** Un vendedor genera un link de pago con las condiciones del acuerdo (ej: "Compra de entrada para evento - 50 USDC").
2. **Depósito Seguro en Arbitrum Stylus:** El comprador abre el link (vía Telegram Mini App / Web) y deposita stablecoins en un contrato inteligente de Stylus usando Social Login / Passkeys (Account Abstraction con Privy).
3. **Liberación Normal:** Si ambas partes están conformes, el comprador o el vendedor liberan los fondos al completar la transacción.
4. **Mediación por IA en GCP (Disputas):** Si surge un conflicto (ej. "el producto no llegó" o "la entrada era falsa"), las partes suben conversaciones y recibos a **GCP Cloud Storage**. Un **Agente de IA Resolutor (GPT-4o Vision)** alojado en **GCP Cloud Run** analiza la evidencia y emite un **veredicto firmado criptográficamente** (con clave aislada en **GCP Secret Manager**), el cual llama al contrato en Stylus para ejecutar el reembolso o la liberación automáticamente.

---

## 🛠️ 3. ARQUITECTURA TÉCNICA Y STACK

### A. Smart Contracts (Arbitrum Stylus / Rust)
* **Lenguaje:** Rust con el SDK `stylus-sdk` (restricción `#![no_std]` para optimización WASM).
* **Red:** Arbitrum Sepolia Testnet.
* **Funciones Clave del Contrato:**
  * `create_escrow(buyer, seller, amount, details_hash)`
  * `deposit(escrow_id)`
  * `release(escrow_id)` (llamado por el comprador o vendedor)
  * `refund(escrow_id)` (llamado por acuerdo mutuo)
  * `resolve_dispute_with_signature(escrow_id, winner, signature, v, r, s)`
* **Seguridad Crítica:** La función `resolve_dispute_with_signature` DEBE verificar en el contrato que la firma criptográfica (ECDSA `secp256k1`) pertenece a la Clave Pública del Oráculo de IA registrado.

### B. Backend & Agente de IA Mediador (GCP Cloud Run)
* **Framework:** Express / Node.js 20 TypeScript en Google Cloud Run.
* **Modelo IA:** OpenAI GPT-4o Vision (soporte multimodal para lectura de imágenes, OCR de recibos y análisis contextual de chats).
* **Modulo Oráculo:** Servicio que recupera la Clave Privada del Oráculo desde **GCP Secret Manager**. Al emitirse el veredicto en JSON, el Oráculo firma el hash `(escrow_id + winner_address)` y lo devuelve al cliente para la ejecución on-chain.

### C. Frontend & UX
* **Framework:** Next.js 14+ (App Router), TypeScript, Vanilla CSS / Tailwind.
* **Distribución:** Mobile-first web app integrada como **Telegram Mini App (TMA)**.
* **Account Abstraction:** Privy (Social Logins + Passkeys) para generar wallets invisibles en Arbitrum Sepolia sin semilla de 12 palabras.
