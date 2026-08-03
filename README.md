# ⚖️ Lexius Pay: Enlaces de Pagos Seguros con Árbitro IA en Arbitrum Stylus

> **Protocolo de pagos seguros y protección de compras por enlaces sociales desarrollado sobre Scaffold-Stylus con resolución de disputas autónoma por Inteligencia Artificial (GPT-4o Vision) alojada en Google Cloud Platform y smart contracts en Rust WASM sobre Arbitrum Stylus.**

[![ETH Lima Hackathon 2026](https://img.shields.io/badge/Event-ETH_Lima_Hackathon_2026-6200ea.svg?style=for-the-badge&logo=ethereum)](https://ethlima.org/)
[![Arbitrum Bounty - Advanced](https://img.shields.io/badge/Arbitrum_Bounty-ADVANCED_CATEGORY_(Scaffold--Stylus_%2B_AI)-ff007a.svg?style=for-the-badge&logo=arbitrum)](https://docs.arbitrum.io/stylus/stylus-quickstart)
[![Arbitrum Sepolia](https://img.shields.io/badge/Network-Arbitrum_Stylus_Sepolia-28A0F0.svg?style=for-the-badge&logo=arbitrum)](https://sepolia-rollup.arbitrum.io/rpc)
[![Smart Contract](https://img.shields.io/badge/Contract-Rust_(Stylus_WASM)-black.svg?style=for-the-badge&logo=rust)](https://docs.arbitrum.io/stylus/stylus-quickstart)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js_14_App_Router-black.svg?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![Backend](https://img.shields.io/badge/Backend-GCP_Cloud_Run-4285F4.svg?style=for-the-badge&logo=googlecloud)](https://cloud.google.com/run)
[![AI Engine](https://img.shields.io/badge/AI_Engine-GPT--4o_Vision-10a37f.svg?style=for-the-badge&logo=openai)](https://openai.com/)

---

## 🏆 Categoría de Bounty: ADVANCED (Scaffold-Stylus + AI)

Lexius Pay califica a la categoría máxima **ADVANCED Bounty** patrocinada por el ecosistema **Arbitrum**:
1. **Desarrollo sobre Scaffold-Stylus**: Smart contracts construidos en Rust (`#![no_std]`) WASM para la red Arbitrum Stylus Sepolia, utilizando la arquitectura y SDK de Scaffold-Stylus para comunicación contract-to-dapp.
2. **Integración de Inteligencia Artificial Multimodal**: Agente Oráculo Autónomo en GCP Cloud Run con GPT-4o Vision para inspección de comprobantes OCR y firmas de veredictos ECDSA `(v, r, s)`.

---

## 👥 Equipo (Team Lexius)

| Integrante | Rol | Especialidad & Entregables |
| :--- | :--- | :--- |
| **Campozano Lopez Samuel** | *Blockchain Developer* | Scaffold-Stylus, Rust (`#![no_std]`), Smart Contracts WASM, ECDSA `secp256k1` ecrecover. |
| **Vera Parrales Jonathan** | *Full-Stack & Cloud Developer* | Next.js 14 App Router, Telegram Mini App SDK, Privy Passkeys, AI Oracle en GCP Cloud Run & Secret Manager. |
| **Colmenares Isabel** | *Designer & Presentation Lead* | UI/UX Design System, Pitch Deck, Video Demo, Storytelling & Branding. |

---

## 📌 Resumen Ejecutivo

**Lexius Pay** (`lexius-pay`) es un protocolo descentralizado de **pagos protegidos por enlaces sociales** (Telegram, WhatsApp, Instagram Marketplace). 

Permite que cualquier persona compre o venda productos y servicios en redes sociales de forma 100% segura: el vendedor genera un link de pago en **10 segundos**, el comprador deposita stablecoins (USDC) en un contrato inteligente de **Arbitrum Stylus en Rust** mediante **Passkeys / Social Login (Privy)** sin fricción Web3, y en caso de conflicto, un **Agente de Inteligencia Artificial (GPT-4o Vision)** alojado en **Google Cloud Run** evalúa las evidencias (capturas de chats, recibos OCR) y emite un veredicto firmado criptográficamente que ejecuta el reembolso o pago automáticamente on-chain.


---

## 💡 El Problema y Nuestra Solución

### 🔴 El Problema
1. **Riesgo de Estafa P2P:** En el comercio social informal (Telegram, WhatsApp, Marketplace), miles de dólares se pierden a diario porque el comprador debe transferir dinero por adelantado sin garantía o el vendedor envía productos sin cobrar.
2. **Escrows Tradicionales Lentos y Costosos:** Los mediadores humanos cobran comisiones elevadas (5%–15%) y tardan días o semanas en resolver una disputa.
3. **Fricción Web3:** El usuario común no entiende de frases semilla de 12 palabras, comisiones de gas elevadas ni instalaciones complejas de wallets.

### 🟢 La Solución Lexius Pay
1. **Links de Pago Sociales en 10s:** El vendedor crea un acuerdo de custodia mediante un link compartido directo en Telegram o la Web.
2. **Contratos en Stylus (Rust / WASM):** Los fondos se congelan en un smart contract en Rust compilado a WASM en Arbitrum Sepolia, logrando velocidad ultra rápida y comisiones de gas de centavos.
3. **Login Web2 (Account Abstraction):** Autenticación en 1-clic con Passkeys (FaceID / TouchID) o Google mediante Privy, generando wallets embebidas invisibles.
4. **Mediación por IA (GCP Cloud Run):** GPT-4o Vision procesa las capturas de chat y comprobantes de pago subidos a **Google Cloud Storage (GCS)** y firma un veredicto ECDSA con su clave resguardada en **GCP Secret Manager**.

---

## 🏛️ Los 4 Pilares del Proyecto

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                LEXIUS PAY                                   │
 └──────┬──────────────────────┬──────────────────────┬────────────────────────┘
        │                      │                      │
 ┌──────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐        ┌─────────────┐
 │   PILAR 1   │        │   PILAR 2   │        │   PILAR 3   │        │   PILAR 4   │
 │ Trust &     │        │ AI Autonomous│        │ Frictionless│        │ Enterprise  │
 │ Escrow      │        │ Mediator    │        │ Social UX   │        │ Cloud & Sec │
 └─────────────┘        └─────────────┘        └─────────────┘        └─────────────┘
```

### 🛡️ Pilar 1: Confianza Descentralizada (Trust & Escrow)
* **Stack:** Rust, `stylus-sdk`, `alloy-primitives`, Arbitrum Sepolia.
* **Descripción:** Ninguna de las partes puede manipular los fondos. La custodia y la lógica de liberación (`release`, `refund`) o resolución de disputas (`resolve_dispute_with_signature`) son 100% inmutables y verificables on-chain.

### ⚖️ Pilar 2: Mediación Autónoma por IA (The AI Mediator Agent)
* **Stack:** Express, Node.js, OpenAI GPT-4o Vision, Ethers.js (ECDSA Signer).
* **Descripción:** Reemplazo completo de árbitros humanos. El Oráculo analiza evidencias en imágenes y texto con OCR, evalúa el acuerdo y emite un veredicto estructurado en JSON firmado digitalmente (`v, r, s`).

### 📱 Pilar 3: Experiencia Social Sin Fricción (Social UX)
* **Stack:** Telegram Mini App SDK (`@twa-dev/sdk`), Next.js 14, Privy, Viem.
* **Descripción:** Experiencia móvil integrada en Telegram.Onboarding instantáneo sin requerir extensiones de navegador ni claves privadas manuales.

### ☁️ Pilar 4: Infraestructura Cloud Empresarial (GCP Stack)
* **Stack:** Google Cloud Run, GCP Secret Manager, Google Cloud Storage (GCS), Docker.
* **Descripción:** La clave privada del Oráculo de IA (`ORACLE_PRIVATE_KEY`) está totalmente aislada en **GCP Secret Manager** e inyectada en memoria en tiempo de ejecución a **Google Cloud Run**, garantizando cero fugas en repositorios de GitHub.

---

## 🏗️ Arquitectura Técnica del Sistema

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     GOOGLE CLOUD PLATFORM (GCP)                         │
│                                                                         │
│ ┌───────────┐       ┌────────────────────┐      ┌─────────────────────┐ │
│ │  Telegram │       │   GCP Cloud Run    │      │ GCP Secret Manager  │ │
│ │ Mini App  │ ────► │  (ai-oracle Node)  │ ◄─── │ • ORACLE_PRIV_KEY   │ │
│ │ / Next.js │       │  • GPT-4o Vision   │      │ • OPENAI_API_KEY    │ │
│ └───────────┘       │  • ECDSA Signer    │      │ • STYLUS_RPC_URL    │ │
│                     └──────────┬─────────┘      └─────────────────────┘ │
│                                │                                        │
│                     ┌──────────▼─────────┐                              │
│                     │ Cloud Storage GCS  │                              │
│                     │ (Recibos y Fotos   │                              │
│                     │  de Disputas)      │                              │
│                     └────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼ (Signed JSON Verdict & ECDSA v, r, s)
                        ┌─────────────────────┐
                        │ Arbitrum Stylus     │
                        │ Smart Contract      │
                        │ (Rust / WASM)       │
                        └─────────────────────┘
```

---

## 📂 Estructura del Monorepo

```text
lexius-pay/                         # Raíz del Monorepo
├── README.md                       # Documentación principal del hackathon
├── docker-compose.yml              # Orquestación de réplica local (Frontend + AI Oracle)
├── GCP_INTEGRATION_GUIDE.md        # Guía técnica de despliegue en Google Cloud Platform
├── PROJECT_CONTEXT.md              # Memoria global del proyecto
│
├── contracts/                      # 🦀 Módulo 1: Smart Contracts (Arbitrum Stylus)
│   ├── Cargo.toml                  # Dependencias de Rust (stylus-sdk, alloy-primitives)
│   ├── Stylus.toml                 # Configuración de compilación WASM
│   └── src/
│       ├── lib.rs                  # Lógica principal del Escrow y verificación ECDSA
│       ├── main.rs                 # Exportador de ABI para cargo-stylus
│       ├── types.rs                # Estructuras de datos (EscrowStatus enum)
│       └── crypto.rs               # Construcción de Ethereum Signed Message Hash
│
├── frontend/                       # ⚡ Módulo 2: Next.js 14+ & Telegram Mini App (TMA)
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── Dockerfile                  # Imagen multi-stage para Next.js
│   ├── .env.example
│   └── src/
│       ├── app/                    # Next.js 14 App Router
│       │   ├── layout.tsx          # Root Layout (PrivyProvider + Telegram SDK)
│       │   ├── page.tsx            # Landing Page & Generador de Links
│       │   ├── pay/[id]/page.tsx   # Pantalla de pago y depósito del comprador
│       │   ├── dispute/[id]/page.tsx # Centro de disputa por IA e imagen preview
│       │   └── dashboard/page.tsx  # Panel de seguimiento del usuario
│       │
│       ├── components/
│       │   ├── WalletLogin.tsx     # Autenticación Web2/Passkeys con Privy
│       │   ├── Navbar.tsx          # Barra de navegación
│       │   └── EscrowCard.tsx      # Tarjeta interactiva de contratos
│       │
│       ├── hooks/
│       │   ├── usePrivyAuth.ts     # Custom hook para Privy Auth
│       │   └── useStylusContract.ts# Custom hook para invocación de contratos Viem
│       │
│       └── lib/
│           ├── contracts.ts        # ABI & Dirección del contrato Stylus
│           ├── telegram.ts         # Inicialización de Telegram Mini App SDK
│           └── gcs.ts              # Helper de subida de evidencias a GCS
│
└── ai-oracle/                      # ☁️ Módulo 3: AI Oracle Mediator (Node.js / Express)
    ├── package.json
    ├── tsconfig.json
    ├── Dockerfile                  # Imagen multi-stage optimizada para GCP Cloud Run
    └── src/
        ├── index.ts                # Inicialización del servidor Express
        ├── routes/
        │   └── dispute.ts          # Endpoint Express API: /api/dispute/resolve
        ├── services/
        │   ├── ai.ts               # Evaluación multimodal con GPT-4o Vision
        │   └── gcp.ts              # Integración con GCP Secret Manager
        └── utils/
            ├── signer.ts           # Firmador criptográfico ECDSA (v, r, s)
            └── formatters.ts       # Formateador de respuesta JSON
```

---

## 🚀 Despliegue y Ejecución Local (Local Replica)

Para levantar el sistema completo y probar los smart contracts y el frontend localmente mediante contenedores:

### 1. Requisitos Previos
* Node.js v20+
* Docker & Docker Compose
* Rust Toolchain (`rustup target add wasm32-unknown-unknown`) y `cargo-stylus` (opcional para desarrollo de smart contracts).

### 2. Configurar Variables de Entorno
Crea tus archivos `.env.local` en los subdirectorios basados en los templates `.env.example`:

```bash
# /frontend/.env.local
NEXT_PUBLIC_PRIVY_APP_ID="clxxxxxxx0000xxxxxxx"
NEXT_PUBLIC_AI_ORACLE_URL="http://localhost:8080"
NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS="0x33f54de59419570a9442e788f5dd5cf635b3c7ac"
NEXT_PUBLIC_STYLUS_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# /ai-oracle/.env.local (Para pruebas locales antes de GCP Secret Manager)
PORT=8080
ORACLE_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
OPENAI_API_KEY="sk-proj-YOUR_OPENAI_KEY"
STYLUS_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
```

### 3. Compilar e Implementar el Contrato Stylus en Rust (Dev 1)
```bash
cd contracts
cargo stylus check
cargo stylus deploy \
  --endpoint='https://sepolia-rollup.arbitrum.io/rpc' \
  --private-key="TU_CLAVE_PRIVADA_SEPOLIA"
```

### 4. Ejecutar el Frontend y el Oráculo con Docker Compose (Dev 2)
Desde la raíz del monorepo, ejecuta:

```bash
docker compose up --build
```

* **Frontend:** Disponible en `http://localhost:3000` (Utiliza Cloudflare Tunnels `npx cloudflared tunnel --url http://localhost:3000` para probar la Telegram Mini App en tu teléfono).
* **AI Oracle API:** Disponible en `http://localhost:8080/api/dispute/resolve`.

---

## 🌐 Enlaces de Demostración y Contacto

* **Aplicación Web (Staging):** [https://lexiuspay.app](https://lexiuspay.app)
* **Bot de Telegram:** [@LexiusPayBot](https://t.me/LexiusPayBot)
* **Arbitrum Sepolia Contract Address:** [`0x33f54de59419570a9442e788f5dd5cf635b3c7ac`](https://sepolia.arbiscan.io/address/0x33f54de59419570a9442e788f5dd5cf635b3c7ac)
* **Guía Completa de GCP:** [GCP_INTEGRATION_GUIDE.md](file:///d:/Personal%20Portfolio/Hacthon%202026%20%20Arbitrum%20Stylus/Lexius/GCP_INTEGRATION_GUIDE.md)

---

*Proyecto desarrollado exclusivamente para la **ETH Lima Hackathon 2026** por el Team Lexius.*
