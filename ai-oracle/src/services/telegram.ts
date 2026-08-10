import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'LexiusPayBot';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lexius-frontend-staging-265650435557.us-central1.run.app';

let bot: Telegraf | null = null;

// In-memory user store mapping username (lowercase, without @) -> chatId
export const userStore = new Map<string, number | string>();

/** Register or update a user's chatId by username */
export function registerUser(username?: string, chatId?: number | string): void {
  if (username && chatId) {
    const sanitized = String(username).trim().replace(/^@/, '').toLowerCase();
    if (sanitized) {
      userStore.set(sanitized, chatId);
    }
  }
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

  return `${baseUrl}/pay/${String(escrowId)}?${query.toString()}`;
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
    `⚖️ *Lexius Protection Active*`,
    ``,
    `📋 *Escrow #${escrowId}*`,
    `${description}`,
    ``,
    `💰 *Amount:* ${amount} USDC`,
    `🔗 *Network:* Arbitrum Sepolia`,
    `🏪 *Seller:* ${sellerName || 'N/A'}`,
    `📍 \`${seller.slice(0, 6)}...${seller.slice(-4)}\``,
    ``,
    `_Funds will be held in a smart contract escrow until the buyer confirms receipt._`,
  ].join('\n');

  const webAppUrl = buildMiniAppUrl('deposit', String(escrowId), { amount, description, seller, sellerName });

  const msg = await b.telegram.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp(`💳 Pay ${amount} USDC`, webAppUrl)],
    ]),
  });

  return { messageId: msg.message_id };
}

/** Update an existing escrow card message based on new status */
export async function updateEscrowCard(params: {
  chatId: number | string;
  messageId: number;
  escrowId: string;
  newStatus: 'deposited' | 'completed' | 'disputed';
  amount: string;
  description: string;
}): Promise<void> {
  const { chatId, messageId, escrowId, newStatus, amount, description } = params;
  const b = getBot();

  let text: string;
  let keyboard: any = undefined;

  switch (newStatus) {
    case 'deposited': {
      const releaseUrl = buildMiniAppUrl('release', String(escrowId), { amount, description });
      text = [
        `🔒 *Funds Secured*`,
        ``,
        `📋 *Escrow #${escrowId}*`,
        `${description}`,
        ``,
        `💰 *${amount} USDC* locked in Stylus Escrow`,
        ``,
        `_The buyer has deposited the funds. Seller can now ship the item._`,
        `_Click below to release funds after confirming receipt._`,
      ].join('\n');
      keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp('🔓 Release Funds', releaseUrl)],
      ]);
      break;
    }
    case 'completed':
      text = [
        `✅ *Escrow Completed!*`,
        ``,
        `📋 *Escrow #${escrowId}*`,
        `${description}`,
        ``,
        `💰 *${amount} USDC* released to the seller`,
        ``,
        `_Thank you for using Lexius Pay! Your transaction is protected by Arbitrum Stylus._`,
      ].join('\n');
      // No keyboard for completed
      break;
    case 'disputed':
      text = [
        `⚠️ *Dispute Raised*`,
        ``,
        `📋 *Escrow #${escrowId}*`,
        `${description}`,
        ``,
        `💰 *${amount} USDC* held in escrow`,
        ``,
        `_The AI Oracle is analyzing the dispute evidence. A verdict will be issued shortly._`,
      ].join('\n');
      // No keyboard for disputed
      break;
  }

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
