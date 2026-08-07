export type Language = 'es' | 'en';

export const dictionary = {
  es: {
    // Navbar
    navCreate: 'Crear Enlace',
    navDashboard: 'Panel',
    navAiSimulator: 'Simulador Árbitro IA',
    navConnect: 'Conectar / Passkey',
    
    // Hero
    heroBadge: 'ETH Lima 2026 • Arbitrum Stylus WASM + GCP IA Oráculo',
    heroTitle1: 'Enlaces de Pagos Protegidos con ',
    heroTitleGradient: 'Mediación de Disputas por IA',
    heroSub: 'Crea un enlace de pago seguro en 10 segundos para Telegram o WhatsApp. Tus fondos se protegen en contratos inteligentes Rust WASM y los conflictos se resuelven en segundos con GPT-4o Vision en Google Cloud.',
    btnGenerate: 'Crear Enlace Protegido',
    btnDemo: 'Probar Demo Árbitro IA',

    // Escrow Generator
    genTitle: 'Crear Enlace de Pago Protegido',
    genSub: 'Genera un acuerdo de compra o venta seguro en segundos',
    genWasmBadge: 'Stylus WASM',
    labelDesc: 'Descripción del Producto o Servicio',
    placeholderDesc: 'ej. Entrada VIP Concierto / Trabajo Diseño Freelance',
    labelAmount: 'Monto (USDC / ETH)',
    labelNetwork: 'Red Destino',
    labelSeller: 'Billetera Vendedor (Opcional)',
    placeholderSeller: '0x... (Déjalo vacío para usar tu billetera)',
    btnCreate: 'Crear Enlace Protegido',
    createdTitle: '¡Enlace de Pago Protegido Creado!',
    createdSub: 'Comparte este enlace por Telegram, WhatsApp o correo con tu contraparte:',
    btnCopy: 'Copiar Enlace de Pago',
    copied: '¡Copiado al Portapapeles!',
    btnPayPage: 'Abrir Enlace de Pago',

    // AI Simulator
    simBadge: 'Demo Interactivo',
    simTitle: 'Simulador de Árbitro IA Autónomo',
    simSub: 'Simula cómo GPT-4o Vision evalúa recibos de disputas en GCP Cloud Run y firma veredictos ECDSA en Arbitrum Stylus.',
    sampleClaimTitle: 'Disputa de Ejemplo: Reclamo de Entrada Falsa a Evento',
    sampleClaimSub: 'El comprador afirma que el escaneo del código de barras falló en la puerta del evento',
    btnRunAi: 'Ejecutar Resolución GPT-4o',
    simulatingAi: 'Analizando Evidencia en GCP Cloud Run...',
    verdictTitle: 'Veredicto Firmado por Oráculo IA',
    winnerLabel: 'Ganador de Disputa:',
    buyerWinner: 'Comprador (Reembolso Autorizado)',
    confidenceLabel: 'Confianza de Análisis:',
    reasoningLabel: 'Razonamiento Legal e IA (Vision OCR):',
    sampleReasoning: 'GPT-4o Vision OCR verificó la imagen del recibo de la entrada. Se detectó discrepancia del código de barras con la base de datos oficial del organizador. Reembolso concedido al Comprador.',
    summaryLabel: 'Resumen de Resolución:',
    signatureLabel: 'Firma Criptográfica ECDSA (v, r, s):',
    hostLabel: 'Servidor GCP Host:',

    // Feature Pillars
    pillar1Title: 'Arbitrum Stylus WASM',
    pillar1Desc: 'Contrato inteligente escrito en Rust (#![no_std]). Tarifas de gas de sub-centavo y ejecución ultrarrápida en Arbitrum Sepolia.',
    pillar2Title: 'GCP Mediador IA Vision',
    pillar2Desc: 'GPT-4o Vision alojado en Google Cloud Run evalúa chats y recibos, firmando veredictos ECDSA con llaves de GCP Secret Manager.',
    pillar3Title: 'UX Telegram Mini App',
    pillar3Desc: 'Cero fricción de frases semilla. Conexión mediante Passkeys (FaceID / TouchID) o Google con Privy.',

    // Footer
    footerText: 'Lexius Pay © 2026 — Desarrollado en Arbitrum Stylus y Google Cloud Platform',

    // Dashboard
    dashTitle: 'Panel de Control de Pagos',
    dashSub: 'Gestiona tus depósitos activos y disputas protegidas en Arbitrum Stylus',
    noEscrows: 'No se encontraron depósitos de pago activos.',
    
    // Dispute page
    disputeTitle: 'Resolución de Disputa con IA',
    disputeSub: 'Carga pruebas de chat o fotos de recibos para mediación automática con GPT-4o Vision',

    // Pay page
    payTitle: 'Acuerdo de Escrow Lexius',
    paySubtitle: 'Contrato WASM en Arbitrum Stylus',
    payItemDesc: 'Descripción del Artículo',
    payTotalAmount: 'Monto Total',
    payNetwork: 'Red',
    payParticipants: 'Participantes del Acuerdo',
    paySeller: 'Vendedor',
    payBuyer: 'Comprador',
    payYou: '(Tú)',
    paySellerName: 'Nombre del Vendedor',
    payBuyerName: 'Nombre del Comprador',
    payCopyAddress: 'Copiar dirección',
    payAddressCopied: '¡Dirección copiada!',
    payWaitingBuyer: 'Esperando depósito del comprador...',
    payDepositBtn: 'Depositar Fondos en Escrow',
    payConnectDeposit: 'Conectar Billetera y Depositar',
    payConfirmRelease: 'Confirmar Recepción y Liberar Fondos',
    payOpenDispute: 'Abrir Centro de Resolución IA',
    payEscrowReleased: '¡Escrow Liberado con Éxito!',
    payFundsTransferred: 'Fondos transferidos al vendedor en Arbitrum Sepolia.',
    payBackGenerator: '← Volver al Generador',
    payUnknown: 'Desconocido',

    // Generator name field
    labelSellerName: 'Tu Nombre (visible en el enlace)',
    placeholderSellerName: 'ej. Carlos López',

    // AI Status Banner
    aiStatusTitle: 'Estado del Asistente IA Lexius',
    aiOracleActive: 'GCP Oráculo GPT-4o Activo',
    aiStatusPendingTitle: 'Esperando al Comprador',
    aiStatusPendingDesc: 'El vendedor ({seller}) creó este enlace por {amount} USDC. Al depositar, los fondos quedarán congelados en el contrato inteligente Arbitrum Stylus.',
    aiStatusDepositedTitle: 'Fondos Protegidos en Bóveda',
    aiStatusDepositedDesc: '{amount} USDC congelados on-chain. El vendedor debe enviar el producto o entrada. Al recibirlo, el comprador presiona "Confirmar y Liberar". Si hay algún conflicto, cualquiera puede abrir una Disputa IA.',
    aiStatusCompletedTitle: 'Escrow Liberado',
    aiStatusCompletedDesc: '{amount} USDC transferidos exitosamente a la billetera del vendedor. ¡Acuerdo completado en Arbitrum Sepolia!',

    // Welcome Gift Modal
    giftTitle: '¡Regalo de Bienvenida Reclamado!',
    giftSub: '¡Hemos acreditado activos de prueba en tu billetera para que pruebes Lexius Pay inmediatamente!',
    giftBonusStable: 'Establecoin de Bono',
    giftGasFee: 'Gas de Arbitrum',
    giftExplorerLink: 'Ver Transferencia USDC en Arbiscan',
    giftCta: 'Comenzar a Explorar 🚀',
  },
  en: {
    // Navbar
    navCreate: 'Create Link',
    navDashboard: 'Dashboard',
    navAiSimulator: 'AI Mediator Simulator',
    navConnect: 'Connect / Passkey',

    // Hero
    heroBadge: 'ETH Lima 2026 • Arbitrum Stylus WASM + GCP AI Oracle',
    heroTitle1: 'Protected Payment Links with ',
    heroTitleGradient: 'AI Dispute Mediation',
    heroSub: 'Create a 10-second payment link for Telegram or WhatsApp. Funds are protected safely in Rust WASM contracts. Conflicts are settled in seconds by GPT-4o Vision on Google Cloud.',
    btnGenerate: 'Create Protected Link',
    btnDemo: 'Test AI Mediator Demo',

    // Escrow Generator
    genTitle: 'Create Protected Payment Link',
    genSub: 'Generate a secure payment agreement in seconds',
    genWasmBadge: 'Stylus WASM',
    labelDesc: 'Item or Service Description',
    placeholderDesc: 'e.g. VIP Concert Ticket / Freelance Design Work',
    labelAmount: 'Amount (USDC / ETH)',
    labelNetwork: 'Target Network',
    labelSeller: 'Seller Wallet Address (Optional)',
    placeholderSeller: '0x... (Leave empty to use your wallet)',
    btnCreate: 'Create Protected Link',
    createdTitle: 'Protected Payment Link Created!',
    createdSub: 'Share this link via Telegram, WhatsApp, or email with your counterpart:',
    btnCopy: 'Copy Payment Link',
    copied: 'Copied to Clipboard!',
    btnPayPage: 'Open Payment Page',

    // AI Simulator
    simBadge: 'Interactive Demo',
    simTitle: 'Autonomous AI Mediator Simulator',
    simSub: 'Simulate how GPT-4o Vision evaluates dispute receipts on GCP Cloud Run and signs ECDSA verdicts on Arbitrum Stylus.',
    sampleClaimTitle: 'Sample Dispute: Fake Event Ticket Claim',
    sampleClaimSub: 'Buyer claims barcode OCR scan failed at venue gate',
    btnRunAi: 'Run GPT-4o Resolution',
    simulatingAi: 'Evaluating Evidence on GCP Cloud Run...',
    verdictTitle: 'AI Oracle Signed Verdict',
    winnerLabel: 'Dispute Winner:',
    buyerWinner: 'Buyer (Refund Authorized)',
    confidenceLabel: 'Analysis Confidence:',
    reasoningLabel: 'Legal Reasoning & AI (Vision OCR):',
    sampleReasoning: 'GPT-4o Vision OCR verified the event ticket receipt image. Barcode mismatch detected against official organizer database. Refund granted to Buyer.',
    summaryLabel: 'Resolution Summary:',
    signatureLabel: 'ECDSA Cryptographic Signature (v, r, s):',
    hostLabel: 'GCP Host Server:',

    // Feature Pillars
    pillar1Title: 'Arbitrum Stylus WASM',
    pillar1Desc: 'Smart contract written in Rust (#![no_std]). Sub-cent gas fees and blazing fast execution on Arbitrum Sepolia.',
    pillar2Title: 'GCP AI Vision Mediator',
    pillar2Desc: 'GPT-4o Vision hosted on Google Cloud Run evaluates chat receipts and signs ECDSA verdicts with GCP Secret Manager keys.',
    pillar3Title: 'Telegram Mini App UX',
    pillar3Desc: 'Zero seed-phrase friction. Connect via Passkeys (FaceID / TouchID) or Google social logins with Privy.',

    // Footer
    footerText: 'Lexius Pay © 2026 — Built on Arbitrum Stylus & Google Cloud Platform',

    // Dashboard
    dashTitle: 'Payment Dashboard',
    dashSub: 'Manage your active deposits and protected disputes on Arbitrum Stylus',
    noEscrows: 'No active payment deposits found.',

    // Dispute page
    disputeTitle: 'AI Dispute Resolution',
    disputeSub: 'Upload chat receipts or evidence photos for automated GPT-4o Vision mediation',

    // Pay page
    payTitle: 'Lexius Escrow Agreement',
    paySubtitle: 'Arbitrum Stylus WASM Contract',
    payItemDesc: 'Item Description',
    payTotalAmount: 'Total Amount',
    payNetwork: 'Network',
    payParticipants: 'Agreement Participants',
    paySeller: 'Seller',
    payBuyer: 'Buyer',
    payYou: '(You)',
    paySellerName: 'Seller Name',
    payBuyerName: 'Buyer Name',
    payCopyAddress: 'Copy address',
    payAddressCopied: 'Address copied!',
    payWaitingBuyer: 'Waiting for buyer deposit...',
    payDepositBtn: 'Deposit Funds in Escrow',
    payConnectDeposit: 'Connect Wallet & Deposit',
    payConfirmRelease: 'Confirm Receipt & Release Funds',
    payOpenDispute: 'Open AI Resolution Center',
    payEscrowReleased: 'Escrow Released Successfully!',
    payFundsTransferred: 'Funds transferred to seller on Arbitrum Sepolia.',
    payBackGenerator: '← Back to Generator',
    payUnknown: 'Unknown',

    // Generator name field
    labelSellerName: 'Your Name (visible on the link)',
    placeholderSellerName: 'e.g. John Doe',

    // AI Status Banner
    aiStatusTitle: 'Lexius AI Assistant Status',
    aiOracleActive: 'GCP GPT-4o Oracle Active',
    aiStatusPendingTitle: 'Waiting for Buyer',
    aiStatusPendingDesc: 'The seller ({seller}) created this link for {amount} USDC. Upon deposit, funds will be locked safely in the Arbitrum Stylus smart contract vault.',
    aiStatusDepositedTitle: 'Funds Secured in Vault',
    aiStatusDepositedDesc: '{amount} USDC locked on-chain. Seller should deliver the product or ticket. Once received, buyer clicks "Confirm & Release". If any conflict arises, either party can open an AI Dispute.',
    aiStatusCompletedTitle: 'Escrow Released',
    aiStatusCompletedDesc: '{amount} USDC successfully transferred to seller wallet. Agreement completed on Arbitrum Sepolia!',

    // Welcome Gift Modal
    giftTitle: 'Welcome Gift Claimed!',
    giftSub: 'We funded your wallet with testnet assets so you can try Lexius Pay immediately!',
    giftBonusStable: 'Bonus Stablecoin',
    giftGasFee: 'Arbitrum Gas Fee',
    giftExplorerLink: 'View USDC Transfer on Arbiscan',
    giftCta: 'Start Exploring 🚀',
  },
};

