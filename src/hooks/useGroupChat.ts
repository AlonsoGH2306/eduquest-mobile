import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as groupService from '../services/groupService';
import type { ChatAttachment, GroupMessage } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { mergeById, replaceMessage } from '../utils/chatMessages';
import { useAuth } from './useContexts';
import { useRealtimeConnected, useRealtimeEvents, useTyping } from './useRealtime';

const POLL_INTERVAL_MS = 4000;
const CONNECTED_POLL_INTERVAL_MS = 30000;
const PAGE_SIZE = 50;

const bumpThread = (current: GroupMessage[], rootId: number) =>
  current.map((message) =>
    message.id === rootId ? { ...message, threadReplyCount: (message.threadReplyCount ?? 0) + 1 } : message
  );

export function useGroupChat(groupId: number, channelId: number | null) {
  const { user } = useAuth();
  const myId = user?.id;
  const active = channelId !== null;
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const lastIdRef = useRef<number | null>(null);
  const connected = useRealtimeConnected();
  const { typingNames, notifyTyping, clearSelf } = useTyping({ groupId });

  useEffect(() => {
    lastIdRef.current = messages.length > 0 ? messages[messages.length - 1].id : null;
  }, [messages]);

  useEffect(() => {
    if (channelId === null) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setMessages([]);
    groupService
      .getMessages(groupId, { channelId }, controller.signal)
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
  }, [groupId, channelId, reloadKey]);

  useEffect(() => {
    if (channelId === null) return;
    const poll = () => {
      if (AppState.currentState !== 'active') return;
      const after = lastIdRef.current;
      groupService
        .getMessages(groupId, after ? { channelId, after } : { channelId })
        .then((data) => setMessages((current) => mergeById(current, data)))
        .catch(() => undefined);
    };
    const interval = setInterval(poll, connected ? CONNECTED_POLL_INTERVAL_MS : POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [groupId, channelId, connected]);

  useRealtimeEvents((event) => {
    if (event.type !== 'group.message' || event.groupId !== groupId || event.channelId !== channelId) return;
    const message = { ...(event.message as GroupMessage) };
    message.mine = message.authorId === myId;
    if (message.threadRootId) {
      if (event.action === 'created') setMessages((current) => bumpThread(current, message.threadRootId as number));
      return;
    }
    if (event.action === 'created') {
      clearSelf(message.authorId);
      setMessages((current) => mergeById(current, [message]));
    } else {
      setMessages((current) => {
        const previous = current.find((item) => item.id === message.id);
        return replaceMessage(current, { ...message, saved: previous?.saved ?? false });
      });
    }
  }, active);

  const applyUpdate = useCallback((updated: GroupMessage) => {
    setMessages((current) => replaceMessage(current, updated));
  }, []);

  const sendMessage = useCallback(
    async (content: string, attachment?: ChatAttachment, replyToId?: number) => {
      if (channelId === null) return;
      const sent = await groupService.sendMessage(groupId, { content, ...attachment, replyToId, channelId });
      setMessages((current) => mergeById(current, [sent]));
    },
    [groupId, channelId]
  );

  const editMessage = useCallback(
    async (messageId: number, content: string) => applyUpdate(await groupService.editMessage(groupId, messageId, content)),
    [groupId, applyUpdate]
  );

  const deleteMessage = useCallback(
    async (messageId: number) => applyUpdate(await groupService.deleteMessage(groupId, messageId)),
    [groupId, applyUpdate]
  );

  const toggleReaction = useCallback(
    async (messageId: number, emoji: string) => applyUpdate(await groupService.toggleReaction(groupId, messageId, emoji)),
    [groupId, applyUpdate]
  );

  const togglePin = useCallback(
    async (messageId: number, pinned: boolean) => applyUpdate(await groupService.setPinned(groupId, messageId, pinned)),
    [groupId, applyUpdate]
  );

  const votePoll = useCallback(
    async (pollId: number, optionId: number | null) => applyUpdate(await groupService.votePoll(groupId, pollId, optionId)),
    [groupId, applyUpdate]
  );

  const toggleSaved = useCallback(
    async (messageId: number, saved: boolean) => applyUpdate(await groupService.setSaved(groupId, messageId, saved)),
    [groupId, applyUpdate]
  );

  const loadAround = useCallback(
    async (messageId: number) => {
      if (channelId === null) return false;
      const data = await groupService.getMessages(groupId, { channelId, around: messageId });
      if (!data.some((message) => message.id === messageId)) return false;
      setMessages(data);
      setHasOlder(true);
      return true;
    },
    [groupId, channelId]
  );

  const createPoll = useCallback(
    async (question: string, options: string[]) => {
      if (channelId === null) return;
      const created = await groupService.createPoll(groupId, { channelId, question, options });
      setMessages((current) => mergeById(current, [created]));
    },
    [groupId, channelId]
  );

  const loadOlder = useCallback(async () => {
    if (messages.length === 0 || loadingOlder || !hasOlder || channelId === null) return;
    setLoadingOlder(true);
    try {
      const older = await groupService.getMessages(groupId, { channelId, before: messages[0].id });
      setMessages((current) => [...older, ...current]);
      setHasOlder(older.length === PAGE_SIZE);
    } finally {
      setLoadingOlder(false);
    }
  }, [groupId, channelId, messages, loadingOlder, hasOlder]);

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
    toggleReaction,
    togglePin,
    votePoll,
    toggleSaved,
    loadAround,
    createPoll,
    loadOlder,
    retry,
  };
}
