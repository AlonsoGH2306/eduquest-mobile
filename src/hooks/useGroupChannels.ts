import { useCallback, useEffect, useState } from 'react';
import * as groupService from '../services/groupService';
import type { ChannelSettings, GroupChannel, GroupMessage } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { useAuth } from './useContexts';
import { useRealtimeEvents } from './useRealtime';

export function useGroupChannels(groupId: number, activeChannelId: number | null) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<GroupChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    groupService
      .getChannels(groupId, controller.signal)
      .then((data) => {
        setChannels(data);
        setError(null);
      })
      .catch((err) => {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [groupId, reloadKey]);

  useRealtimeEvents((event) => {
    if (event.type === 'group.channels' && event.groupId === groupId) {
      groupService.getChannels(groupId).then(setChannels).catch(() => undefined);
      return;
    }
    if (event.type !== 'group.message' || event.groupId !== groupId || event.action !== 'created') return;
    const message = event.message as GroupMessage;
    const viewing = activeChannelId ?? channels[0]?.id ?? null;
    if (message.authorId === user?.id || message.threadRootId || event.channelId === viewing) return;
    const mentioned = Boolean(user?.username) && message.content.toLowerCase().includes(`@${user?.username.toLowerCase()}`);
    setChannels((current) =>
      current.map((channel) =>
        channel.id === event.channelId
          ? { ...channel, unreadCount: channel.unreadCount + 1, mentionCount: channel.mentionCount + (mentioned ? 1 : 0) }
          : channel
      )
    );
  });

  const markRead = useCallback(
    (channelId: number) => {
      setChannels((current) =>
        current.map((channel) => (channel.id === channelId ? { ...channel, unreadCount: 0, mentionCount: 0 } : channel))
      );
      groupService.markChannelRead(groupId, channelId).catch(() => undefined);
    },
    [groupId]
  );

  const createChannel = useCallback(
    async (settings: ChannelSettings) => {
      const created = await groupService.createChannel(groupId, settings);
      setChannels((current) => [...current.filter((channel) => channel.id !== created.id), created]);
      return created;
    },
    [groupId]
  );

  const updateChannel = useCallback(
    async (channelId: number, settings: ChannelSettings) => {
      const updated = await groupService.updateChannel(groupId, channelId, settings);
      setChannels((current) => current.map((channel) => (channel.id === updated.id ? updated : channel)));
    },
    [groupId]
  );

  const deleteChannel = useCallback(
    async (channelId: number) => {
      await groupService.deleteChannel(groupId, channelId);
      setChannels((current) => current.filter((channel) => channel.id !== channelId));
    },
    [groupId]
  );

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  return { channels, loading, error, markRead, createChannel, updateChannel, deleteChannel, retry };
}
