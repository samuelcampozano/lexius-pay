import fs from 'fs';
import path from 'path';
import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'LexiusPayBot';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lexius-frontend-staging-265650435557.us-central1.run.app';

let bot: Telegraf | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

const USERS_FILE = path.join(DATA_DIR, 'userStore.json');
const CARDS_FILE = path.join(DATA_DIR, 'escrowCardStore.json');

// Global in-memory user store mapping username (lowercase, without @) -> chatId
export const userStore = new Map<string, number | string>();
export const escrowCardStore = new Map<string, { chatId: string | number; messageId: number }>();

// Restore from disk on startup
try {
  if (fs.existsSync(USERS_FILE)) {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([k, v]) => userStore.set(k, v as number | string));
    console.log(`[Telegram Bot] Loaded ${userStore.size} users from disk.`);
  }
} catch (e) {
  console.warn('[Telegram Bot] Error loading userStore from disk:', e);
}

try {
  if (fs.existsSync(CARDS_FILE)) {
    const raw = fs.readFileSync(CARDS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([k, v]) => escrowCardStore.set(k, v as { chatId: string | number; messageId: number }));
    console.log(`[Telegram Bot] Loaded ${escrowCardStore.size} escrow cards from disk.`);
  }
} catch (e) {
  console.warn('[Telegram Bot] Error loading escrowCardStore from disk:', e);
}

function saveUserStore() {
  try {
    const obj = Object.fromEntries(userStore.entries());
    fs.writeFileSync(USERS_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.warn('[Telegram Bot] Error saving userStore to disk:', e);
  }
}

export function saveEscrowCardStore() {
  try {
    const obj = Object.fromEntries(escrowCardStore.entries());
    fs.writeFileSync(CARDS_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.warn('[Telegram Bot] Error saving escrowCardStore to disk:', e);
  }
}

/** Register or update a user's chatId by username */
export function registerUser(username?: string, chatId?: number | string): void {
  if (username && chatId) {
    const sanitized = String(username).trim().replace(/^@/, '').toLowerCase();
    if (sanitized) {
      userStore.set(sanitized, chatId);
      saveUserStore();
      console.log(`[Telegram Bot] Mapped username @${sanitized} -> Chat ID ${chatId}`);
    }
  }
}

export function registerUserChatId(username: string, chatId: number): void {
  registerUser(username, chatId);
}

/**
 * Sanitizes input username and performs a case-insensitive search in userStore.
 * Fallbacks to numeric ID or @sanitizedUsername if not found in store.
 */
export function findChatIdByUsername(rawUsername: string | number): number | string | null {
  if (rawUsername === undefined || rawUsername === null || rawUsername === '') {
    return null;
  }

  // If numeric ID, return as number
  if (typeof rawUsername === 'number' || (!isNaN(Number(rawUsername)) && String(rawUsername).trim() !== '')) {
    return Number(rawUsername);
  }

  // 1. Sanitizar eliminando el símbolo '@' y espacios en blanco
  const sanitizedUsername = String(rawUsername).trim().replace(/^@/, '');
  if (!sanitizedUsername) return null;

  // 2. Búsqueda insensible a mayúsculas/minúsculas en el store en memoria
  const foundChatId = userStore.get(sanitizedUsername.toLowerCase());
  if (foundChatId) {
    return foundChatId;
  }

  // Fallback direct format for Telegram Bot API (@username)
  return `@${sanitizedUsername}`;
}

export function resolveChatId(rawChatId: number | string): number | string {
  const result = findChatIdByUsername(rawChatId);
  return result !== null ? result : String(rawChatId);
}

export function getBot(): Telegraf {
  if (!bot) {
    if (!BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    bot = new Telegraf(BOT_TOKEN);
  }
  return bot;
}

/** Build the direct WebApp URL for Telegram WebApp buttons with dynamic parameters */
export function buildMiniAppUrl(action: string, escrowId: string, params?: { amount?: string; description?: string; seller?: string; sellerName?: string }): string {
  const baseUrl = process.env.FRONTEND_URL || 'https://lexius-frontend-staging-265650435557.us-central1.run.app';
  const query = new URLSearchParams();
  query.set('tmaAction', action);
  if (params?.amount) query.set('amount', params.amount);
  if (params?.description) query.set('description', params.description);
  if (params?.seller) query.set('seller', params.seller);
  if (params?.sellerName) query.set('sellerName', params.sellerName);

  if (action === 'privy') {
    return `${baseUrl}/?privyAction=${encodeURIComponent(escrowId)}`;
  }

  // Ensure escrowId is a clean numeric string for pay routes
  const cleanId = String(escrowId).replace(/[^0-9]/g, '') || '1';
  return `${baseUrl}/pay/${cleanId}?${query.toString()}`;
}

/** Send initial escrow card with Pay button */
export async function sendEscrowCard(params: {
  chatId: number | string;
  escrowId: string;
  description: string;
  amount: string;
  sellerName: string;
  seller: string;
}): Promise<{ messageId: number }> {
  const { chatId, escrowId, description, amount, sellerName, seller } = params;
  const b = getBot();
  
  const text = [
    `⚖️ *Lexius Pay — Custodia P2P Activa*`,
    ``,
    `📋 *Acuerdo P2P #${escrowId}*`,
    `📦 ${description}`,
    ``,
    `💰 *Monto:* ${amount} USDC`,
    `🌐 *Red:* Arbitrum Sepolia (Stylus WASM)`,
    `🏪 *Vendedor:* ${sellerName || 'Verificado'}`,
    `📍 \`${seller.slice(0, 6)}...${seller.slice(-4)}\``,
    ``,
    `🔒 _Los fondos estarán resguardados por un contrato inteligente WASM hasta que el comprador confirme la recepción._`,
  ].join('\n');

  const webAppUrl = buildMiniAppUrl('deposit', String(escrowId), { amount, description, seller, sellerName });

  const msg = await b.telegram.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp(`💳 Pagar ${amount} USDC`, webAppUrl)],
    ]),
  });

  escrowCardStore.set(String(escrowId), { chatId, messageId: msg.message_id });
  saveEscrowCardStore();

  return { messageId: msg.message_id };
}

/** Update an existing escrow card message based on new status */
export async function updateEscrowCard(params: {
  chatId: number | string;
  messageId?: number;
  escrowId: string;
  newStatus: 'deposited' | 'completed' | 'disputed';
  amount: string;
  description: string;
}): Promise<void> {
  const { chatId, messageId, escrowId, newStatus, amount, description } = params;
  const b = getBot();

  let text: string;
  let keyboard: any = undefined;
  let pushText = '';

  switch (newStatus) {
    case 'deposited': {
      const releaseUrl = buildMiniAppUrl('release', String(escrowId), { amount, description });
      text = [
        `🔒 *Fondos Asegurados y Resguardados*`,
        ``,
        `📋 *Acuerdo P2P #${escrowId}*`,
        `📦 ${description}`,
        ``,
        `💰 *Monto:* ${amount} USDC (Bloqueado en Stylus WASM)`,
        `🌐 *Red:* Arbitrum Sepolia`,
        ``,
        `✅ _El comprador ha depositado los fondos exitosamente en el contrato inteligente._`,
        `🚚 _El vendedor ya puede realizar el envío o entrega._`,
        `🔓 _Haz clic abajo para liberar los fondos una vez recibido el producto._`,
      ].join('\n');
      keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp('🔓 Liberar Fondos al Vendedor', releaseUrl)],
      ]);
      pushText = `🔔 *Notificación de Lexius Pay*\n\n¡Se han congelado *${amount} USDC* en el contrato Stylus WASM para la transacción #${escrowId}! El vendedor ya puede realizar el envío.`;
      break;
    }
    case 'completed':
      text = [
        `🎉 *¡Acuerdo Completado Exitosamente!*`,
        ``,
        `📋 *Acuerdo P2P #${escrowId}*`,
        `📦 ${description}`,
        ``,
        `💰 *Monto:* ${amount} USDC (Liberados al Vendedor)`,
        `🌐 *Red:* Arbitrum Sepolia`,
        ``,
        `✨ _Gracias por operar de forma segura con Lexius Pay y Arbitrum Stylus._`,
      ].join('\n');
      pushText = `🔔 *Notificación de Lexius Pay*\n\n¡Pago de *${amount} USDC* liberado exitosamente al vendedor en la transacción #${escrowId}! Transacción finalizada.`;
      break;
    case 'disputed':
      text = [
        `🚨 *¡Disputa Iniciada!*`,
        ``,
        `📋 *Acuerdo P2P #${escrowId}*`,
        `📦 ${description}`,
        ``,
        `💰 *Monto:* ${amount} USDC (Retenidos en Custodia)`,
        `🤖 *Agente IA:* El Oráculo IA Lexius está analizando la evidencia enviada por las partes.`,
        ``,
        `⚖️ _Se emitirá una resolución justa mediante firma ecrecover en la blockchain._`,
      ].join('\n');
      pushText = `🔔 *Notificación de Lexius Pay*\n\n⚠️ Se ha iniciado una disputa sobre la transacción #${escrowId}. El Oráculo IA Lexius responderá a la brevedad.`;
      break;
  }

  // 1. Try editing existing card message if messageId is available
  if (messageId) {
    try {
      await b.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        text,
        {
          parse_mode: 'Markdown',
          ...(keyboard || {}),
        }
      );
    } catch (err) {
      console.warn(`[Telegram Bot] Edit card message failed for #${escrowId}, sending direct notification message:`, err);
    }
  }

  // 2. Always send direct push notification message to ensure status updates are NEVER missed
  try {
    if (pushText) {
      await b.telegram.sendMessage(chatId, pushText, { parse_mode: 'Markdown' });
    }
  } catch (err) {
    console.warn(`[Telegram Bot] Push notification failed for #${escrowId}:`, err);
  }
}

/** Send welcome message when user starts the bot */
export async function sendWelcomeMessage(chatId: number | string): Promise<void> {
  const b = getBot();
  const baseUrl = process.env.FRONTEND_URL || 'https://lexius-frontend-staging-265650435557.us-central1.run.app';
  
  const text = [
    `🛡️ *Bienvenido a Lexius Pay!*`,
    ``,
    `El primer sistema autónomo de Custodia P2P con IA sobre Arbitrum Stylus.`,
    ``,
    `✨ *Opciones de Acceso Rápido Privy Web2.5:*`,
    `• ✈️ *Telegram Fast Account:* Creación instantánea sin contraseñas`,
    `• 🔍 *Google OAuth:* Inicio de sesión con 1-Clic`,
    `• 💼 *Billeteras / Claves Privadas:* Importa MetaMask, Rabby o tu Key`,
    ``,
    `Elige una opción a continuación o abre la aplicación:`,
  ].join('\n');

  const fastTelegramUrl = buildMiniAppUrl('privy', 'telegram');
  const googleLoginUrl = buildMiniAppUrl('privy', 'google');
  const walletImportUrl = buildMiniAppUrl('privy', 'wallet');

  await b.telegram.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.url('⚡ Creación Rápida con Telegram', fastTelegramUrl)],
      [Markup.button.url('🌐 Iniciar sesión con Google', googleLoginUrl)],
      [Markup.button.url('🔑 Importar / Conectar Billetera', walletImportUrl)],
      [Markup.button.url('🚀 Abrir Lexius Pay App', baseUrl)],
    ]),
  });
}

/** Initialize the bot with command handlers and start webhook or polling */
export async function initBot(app: import('express').Express): Promise<void> {
  if (!BOT_TOKEN) {
    console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN not set. Bot disabled.');
    return;
  }

  const b = getBot();

  // Register /start command
  b.start(async (ctx: any) => {
    if (ctx.from?.username && ctx.chat?.id) {
      registerUser(ctx.from.username, ctx.chat.id);
    }
    await sendWelcomeMessage(ctx.chat.id);
  });

  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

  if (webhookUrl) {
    // Production: Webhook mode
    const webhookPath = '/api/bot/webhook';
    const fullUrl = `${webhookUrl}${webhookPath}`;

    await b.telegram.setWebhook(fullUrl);
    app.use(webhookPath, (req, res) => b.handleUpdate(req.body, res));

    console.log(`[Telegram Bot] Webhook mode active: ${fullUrl}`);
  } else {
    // Development: Long-polling
    b.launch({ dropPendingUpdates: true });
    console.log('[Telegram Bot] Long-polling mode active');

    // Graceful stop
    process.once('SIGINT', () => b.stop('SIGINT'));
    process.once('SIGTERM', () => b.stop('SIGTERM'));
  }
}
