import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  deleteDirectMessage,
  editDirectMessage,
  getDirectMessages,
  sendDirectMessage,
} from '../services/messageService';
import type { ChatAttachment, DirectMessage } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { mergeById, replaceMessage } from '../utils/chatMessages';
import { useAuth } from './useContexts';
import { useRealtimeConnected, useRealtimeEvents, useTyping } from './useRealtime';

const POLL_INTERVAL_MS = 4000;
const CONNECTED_POLL_INTERVAL_MS = 30000;
const PAGE_SIZE = 50;

export function useDirectChat(userId: number) {
  const { user } = useAuth();
  const myId = user?.id;
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const lastIdRef = useRef<number | null>(null);
  const connected = useRealtimeConnected();
  const { typingNames, notifyTyping, clearSelf } = useTyping({ userId });

  useEffect(() => {
    lastIdRef.current = messages.length > 0 ? messages[messages.length - 1].id : null;
  }, [messages]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getDirectMessages(userId, {}, controller.signal)
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
  }, [userId, reloadKey]);

  useEffect(() => {
    const poll = () => {
      if (AppState.currentState !== 'active') return;
      const after = lastIdRef.current;
      getDirectMessages(userId, after ? { after } : {})
        .then((data) => setMessages((current) => mergeById(current, data)))
        .catch(() => undefined);
    };
    const interval = setInterval(poll, connected ? CONNECTED_POLL_INTERVAL_MS : POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId, connected]);

  useRealtimeEvents((event) => {
    if (event.type !== 'direct.message') return;
    const partnerId = event.senderId === myId ? event.recipientId : event.senderId;
    if (partnerId !== userId) return;
    const message = { ...(event.message as DirectMessage) };
    message.mine = message.senderId === myId;
    if (event.action === 'created') {
      clearSelf(message.senderId);
      setMessages((current) => mergeById(current, [message]));
    } else {
      setMessages((current) => replaceMessage(current, message));
    }
  });

  const sendMessage = useCallback(
    async (content: string, attachment?: ChatAttachment, replyToId?: number) => {
      const sent = await sendDirectMessage(userId, { content, ...attachment, replyToId });
      setMessages((current) => mergeById(current, [sent]));
    },
    [userId]
  );

  const editMessage = useCallback(
    async (messageId: number, content: string) => {
      const updated = await editDirectMessage(userId, messageId, content);
      setMessages((current) => replaceMessage(current, updated));
    },
    [userId]
  );

  const deleteMessage = useCallback(
    async (messageId: number) => {
      const deleted = await deleteDirectMessage(userId, messageId);
      setMessages((current) => replaceMessage(current, deleted));
    },
    [userId]
  );

  const loadOlder = useCallback(async () => {
    if (messages.length === 0 || loadingOlder || !hasOlder) return;
    setLoadingOlder(true);
    try {
      const older = await getDirectMessages(userId, { before: messages[0].id });
      setMessages((current) => [...older, ...current]);
      setHasOlder(older.length === PAGE_SIZE);
    } finally {
      setLoadingOlder(false);
    }
  }, [userId, messages, loadingOlder, hasOlder]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    messages,
    loading,
    error,
    hasOlder,
    loadingOlder,
    typingNames,
    notifyTyping,
    sendMessage,
    editMessage,
    deleteMessage,
    loadOlder,
    retry,
  };
}
