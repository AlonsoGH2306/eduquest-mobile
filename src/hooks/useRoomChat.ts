import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as roomService from '../services/roomService';
import type { ChatAttachment, RoomMessage } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { mergeById, replaceMessage } from '../utils/chatMessages';
import { useAuth } from './useContexts';
import { useRealtimeConnected, useRealtimeEvents } from './useRealtime';

const POLL_INTERVAL_MS = 4000;
const CONNECTED_POLL_INTERVAL_MS = 30000;
const PAGE_SIZE = 50;

export function useRoomChat(roomId: number) {
  const { user } = useAuth();
  const myId = user?.id;
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const lastIdRef = useRef<number | null>(null);
  const connected = useRealtimeConnected();

  useEffect(() => {
    lastIdRef.current = messages.length > 0 ? messages[messages.length - 1].id : null;
  }, [messages]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    roomService
      .getRoomMessages(roomId, {}, controller.signal)
      .then((data) => {
        setMessages(data);
        setHasOlder(data.length === PAGE_SIZE);
      })
      .catch((err) => {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [roomId, reloadKey]);

  useEffect(() => {
    const poll = () => {
      if (AppState.currentState !== 'active') return;
      const after = lastIdRef.current;
      roomService
        .getRoomMessages(roomId, after ? { after } : {})
        .then((data) => setMessages((current) => mergeById(current, data)))
        .catch(() => undefined);
    };
    const interval = setInterval(poll, connected ? CONNECTED_POLL_INTERVAL_MS : POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [roomId, connected]);

  useRealtimeEvents((event) => {
    if (event.type !== 'room.message' || event.roomId !== roomId) return;
    const message = { ...(event.message as RoomMessage) };
    message.mine = message.authorId === myId;
    if (event.action === 'created') setMessages((current) => mergeById(current, [message]));
    else setMessages((current) => replaceMessage(current, message));
  });

  const sendMessage = useCallback(
    async (content: string, attachment?: ChatAttachment, replyToId?: number) => {
      const sent = await roomService.sendRoomMessage(roomId, { content, ...attachment, replyToId });
      setMessages((current) => mergeById(current, [sent]));
    },
    [roomId]
  );

  const editMessage = useCallback(
    async (messageId: number, content: string) => {
      const updated = await roomService.editRoomMessage(roomId, messageId, content);
      setMessages((current) => replaceMessage(current, updated));
    },
    [roomId]
  );

  const deleteMessage = useCallback(
    async (messageId: number) => {
      const deleted = await roomService.deleteRoomMessage(roomId, messageId);
      setMessages((current) => replaceMessage(current, deleted));
    },
    [roomId]
  );

  const loadOlder = useCallback(async () => {
    if (messages.length === 0 || loadingOlder || !hasOlder) return;
    setLoadingOlder(true);
    try {
      const older = await roomService.getRoomMessages(roomId, { before: messages[0].id });
      setMessages((current) => [...older, ...current]);
      setHasOlder(older.length === PAGE_SIZE);
    } finally {
      setLoadingOlder(false);
    }
  }, [roomId, messages, loadingOlder, hasOlder]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  return { messages, loading, error, loadingOlder, sendMessage, editMessage, deleteMessage, loadOlder, retry };
}
