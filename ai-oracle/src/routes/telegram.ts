import { Router, Request, Response } from 'express';
import { sendEscrowCard, updateEscrowCard } from '../services/telegram';

const router = Router();

/**
 * POST /api/telegram/send-escrow-card
 * Sends an interactive escrow message to a Telegram chat.
 */
router.post('/send-escrow-card', async (req: Request, res: Response) => {
  try {
    const { chatId, escrowId, description, amount, sellerName, seller } = req.body;

    if (!chatId || !escrowId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: chatId, escrowId',
      });
    }

    // Auto-format username string if leading @ is missing
    const formattedChatId =
      typeof chatId === 'string' && !chatId.startsWith('@') && isNaN(Number(chatId))
        ? `@${chatId}`
        : chatId;

    const result = await sendEscrowCard({
      chatId: formattedChatId,
      escrowId,
      description: description || 'Escrow Agreement',
      amount: amount || '0',
      sellerName: sellerName || '',
      seller: seller || '0x0000000000000000000000000000000000000000',
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
    const { chatId, messageId, escrowId, newStatus, amount, description } = req.body;

    if (!chatId || !messageId || !escrowId || !newStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: chatId, messageId, escrowId, newStatus',
      });
    }

    const validStatuses = ['deposited', 'completed', 'disputed'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    await updateEscrowCard({
      chatId,
      messageId,
      escrowId,
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
