import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as groupService from '../services/groupService';
import type { Group } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { useRealtimeEvents } from '../hooks/useRealtime';
import { useAuth } from '../hooks/useContexts';

const REFRESH_INTERVAL_MS = 60_000;

interface MyGroupsContextValue {
  groups: Group[];
  loading: boolean;
  error: string | null;
  totalUnread: number;
  refresh: () => void;
  markSeen: (groupId: number) => Promise<void>;
  markChatSeen: (groupId: number) => Promise<void>;
}

export const MyGroupsContext = createContext<MyGroupsContextValue | null>(null);

export function MyGroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    groupService
      .getMyGroups(controller.signal)
      .then((data) => {
        setGroups(data);
        setError(null);
      })
      .catch((err) => {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);
  const { user } = useAuth();
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useRealtimeEvents((event) => {
    if (event.type !== 'group.message' || event.action !== 'created') return;
    if ((event.message as { authorId?: number }).authorId === user?.id) return;
    if (pending.current !== null) clearTimeout(pending.current);
    pending.current = setTimeout(() => {
      pending.current = null;
      refresh();
    }, 1500);
  });

  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refresh]);

  const markSeen = useCallback(async (groupId: number) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, unreadCount: 0, unreadDocuments: 0, unreadSessions: 0 } : group
      )
    );
    await groupService.markGroupSeen(groupId);
  }, []);

  const markChatSeen = useCallback(async (groupId: number) => {
    setGroups((current) => current.map((group) => (group.id === groupId ? { ...group, unreadMessages: 0 } : group)));
    await groupService.markChatSeen(groupId);
  }, []);

  const value = useMemo(
    () => ({
      groups,
      loading,
      error,
      totalUnread: groups.reduce((sum, group) => sum + (group.unreadCount ?? 0) + (group.unreadMessages ?? 0), 0),
      refresh,
      markSeen,
      markChatSeen,
    }),
    [groups, loading, error, refresh, markSeen, markChatSeen]
  );

  return <MyGroupsContext.Provider value={value}>{children}</MyGroupsContext.Provider>;
}
