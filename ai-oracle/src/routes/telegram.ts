import { Router, Request, Response } from 'express';
import { sendEscrowCard, updateEscrowCard, findChatIdByUsername, escrowCardStore, saveEscrowCardStore } from '../services/telegram';
import { disputeStore } from './dispute';

const router = Router();

/**
 * POST /api/telegram/send-escrow-card
 * Sends an interactive escrow message to a Telegram chat.
 */
router.post('/send-escrow-card', async (req: Request, res: Response) => {
  try {
    const { chatId, username, escrowId, description, amount, sellerName, seller } = req.body;
    const rawUsername = username || chatId;

    if (!rawUsername || !escrowId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: username or chatId, escrowId',
      });
    }

    // 1. Sanitizar eliminando el símbolo '@' y espacios en blanco
    const sanitizedUsername = String(rawUsername).trim().replace(/^@/, '');

    // 2. Buscar en la base de datos / memoria de forma insensible a mayúsculas y minúsculas (Case-Insensitive)
    const formattedChatId = findChatIdByUsername(sanitizedUsername);

    if (!formattedChatId) {
      return res.status(400).json({
        success: false,
        error: 'Telegram user or chat not found. Make sure the user has started a conversation with the bot first.',
      });
    }

    const result = await sendEscrowCard({
      chatId: formattedChatId,
      escrowId: String(escrowId),
      description: description || 'Escrow Agreement',
      amount: amount || '0',
      sellerName: sellerName || '',
      seller: seller || '0x0000000000000000000000000000000000000000',
    });

    // Save in store for automatic status updates
    escrowCardStore.set(String(escrowId), {
      chatId: formattedChatId,
      messageId: result.messageId,
    });

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      escrowId,
    });
  } catch (error: any) {
    console.error('[Telegram Route] Error sending escrow card:', error);
    const isChatNotFound = error?.message?.includes('chat not found') || error?.description?.includes('chat not found');
    return res.status(400).json({
      success: false,
      error: isChatNotFound
        ? 'Telegram user or chat not found. Make sure the user has started a conversation with the bot first.'
        : 'Failed to send escrow card',
      details: error.message || String(error),
    });
  }
});

/**
 * POST /api/telegram/update-escrow-status
 * Edits an existing escrow message to reflect a status change.
 */
router.post('/update-escrow-status', async (req: Request, res: Response) => {
  try {
    let { chatId, messageId, escrowId, newStatus, amount, description } = req.body;

    if (!escrowId || !newStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: escrowId, newStatus',
      });
    }

    // Auto-resolve chatId and messageId from store if missing from request
    if (!chatId || !messageId) {
      const stored = escrowCardStore.get(String(escrowId));
      if (stored) {
        chatId = chatId || stored.chatId;
        messageId = messageId || stored.messageId;
      }
    }

    if (!chatId || !messageId) {
      console.warn(`[Telegram Route] Skipping status update for Escrow #${escrowId}: No Telegram message card linked.`);
      return res.status(200).json({
        success: false,
        warning: 'No Telegram card linked for this escrowId',
        escrowId,
      });
    }

    const validStatuses = ['deposited', 'completed', 'disputed'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Sync state into disputeStore for cross-device awareness
    const existingRecord = disputeStore.get(String(escrowId)) || {
      escrowId: String(escrowId),
      isDisputed: newStatus === 'disputed',
      status: newStatus as any,
      updatedAt: new Date().toISOString(),
    };

    disputeStore.set(String(escrowId), {
      ...existingRecord,
      isDisputed: newStatus === 'disputed' || existingRecord.isDisputed,
      status: newStatus as any,
      updatedAt: new Date().toISOString(),
    });

    await updateEscrowCard({
      chatId,
      messageId,
      escrowId: String(escrowId),
      newStatus,
      amount: amount || '0',
      description: description || 'Escrow Agreement',
    });

    return res.status(200).json({
      success: true,
      escrowId,
      newStatus,
    });
  } catch (error: any) {
    console.error('[Telegram Route] Error updating escrow status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update escrow status',
      details: error.message || String(error),
    });
  }
});

export default router;
