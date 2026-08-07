import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'LexiusPayBot';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lexius-frontend-staging-265650435557.us-central1.run.app';

let bot: Telegraf | null = null;

export function getBot(): Telegraf {
  if (!bot) {
    if (!BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    bot = new Telegraf(BOT_TOKEN);
  }
  return bot;
}

/** Build the Mini App deep link URL */
export function buildMiniAppUrl(action: string, escrowId: string): string {
  return `https://t.me/${BOT_USERNAME}/app?startapp=${action}_${escrowId}`;
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

  const payUrl = buildMiniAppUrl('deposit', escrowId);

  const msg = await b.telegram.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp(`💳 Pay ${amount} USDC`, payUrl)],
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
      const releaseUrl = buildMiniAppUrl('release', escrowId);
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
  const appUrl = `https://t.me/${BOT_USERNAME}/app`;
  
  const text = [
    `🛡️ *Welcome to Lexius Pay!*`,
    ``,
    `The first autonomous AI-powered P2P escrow on Arbitrum Stylus.`,
    ``,
    `🔗 Create escrow links for safe P2P trades`,
    `🤖 AI Oracle resolves disputes automatically`,
    `⚡ Powered by WASM smart contracts`,
    ``,
    `Tap the button below to launch the app! 🚀`,
  ].join('\n');

  await b.telegram.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Open Lexius Pay', appUrl)],
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
