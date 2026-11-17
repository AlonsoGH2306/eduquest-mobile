import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPinnedChats, setPinnedChat } from '../services/personalService';
import type { PinnedChat, PinnedChatKind } from '../types';
import { useToast } from './useContexts';
import { getErrorMessage, isCanceled } from '../utils/errors';

const keyOf = (kind: PinnedChatKind, targetId: number) => `${kind}:${targetId}`;

export function usePinnedChats() {
  const { showToast } = useToast();
  const [pins, setPins] = useState<PinnedChat[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    getPinnedChats(controller.signal)
      .then(setPins)
      .catch((err) => {
        if (!isCanceled(err)) setPins([]);
      });
    return () => controller.abort();
  }, []);

  const pinnedKeys = useMemo(() => new Set(pins.map((pin) => keyOf(pin.kind, pin.targetId))), [pins]);

  const isPinned = useCallback((kind: PinnedChatKind, targetId: number) => pinnedKeys.has(keyOf(kind, targetId)), [pinnedKeys]);

  const togglePin = useCallback(
    async (kind: PinnedChatKind, targetId: number) => {
      try {
        setPins(await setPinnedChat(kind, targetId, !pinnedKeys.has(keyOf(kind, targetId))));
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      }
    },
    [pinnedKeys, showToast]
  );

  return { isPinned, togglePin };
}
