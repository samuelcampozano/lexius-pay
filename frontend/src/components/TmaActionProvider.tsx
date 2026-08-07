'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getTmaStartParam, parseTmaStartParam } from '@/lib/telegram';

/**
 * TmaActionProvider
 * 
 * Reads Telegram's `startapp` deep link parameter on mount.
 * If a valid action is detected (e.g., `deposit_705`), it auto-navigates
 * the user to the corresponding escrow page with the action pre-loaded.
 * 
 * Supported actions:
 * - `deposit_{escrowId}` → routes to `/pay/{escrowId}?tmaAction=deposit`
 * - `release_{escrowId}` → routes to `/pay/{escrowId}?tmaAction=release`
 */
export default function TmaActionProvider() {
  const router = useRouter();
  const hasRouted = useRef(false);

  useEffect(() => {
    if (hasRouted.current) return;

    const startParam = getTmaStartParam();
    if (!startParam) return;

    const parsed = parseTmaStartParam(startParam);
    if (!parsed) return;

    const { action, escrowId } = parsed;
    const validActions = ['deposit', 'release'];

    if (!validActions.includes(action)) {
      console.warn(`[TMA] Unknown action: ${action}`);
      return;
    }

    hasRouted.current = true;
    console.log(`[TMA] Deep link detected: ${action} for escrow #${escrowId}`);
    router.push(`/pay/${escrowId}?tmaAction=${action}`);
  }, [router]);

  return null; // This component renders nothing
}
