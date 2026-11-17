import { createContext, Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { countUnreadNotifications } from '../services/notificationService';
import { countUnreadMessages } from '../services/messageService';
import { useRealtimeEvents } from '../hooks/useRealtime';
import { useAuth } from '../hooks/useContexts';

const REFRESH_INTERVAL_MS = 30_000;

interface NotificationsContextValue {
  unreadNotifications: number;
  unreadMessages: number;
  refresh: () => void;
  setUnreadNotifications: Dispatch<SetStateAction<number>>;
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    countUnreadNotifications(controller.signal)
      .then(setUnreadNotifications)
      .catch(() => undefined);
    countUnreadMessages(controller.signal)
      .then(setUnreadMessages)
      .catch(() => undefined);
    return () => controller.abort();
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);
  const { user } = useAuth();
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useRealtimeEvents((event) => {
    if (event.type !== 'direct.message' || event.action !== 'created' || event.recipientId !== user?.id) return;
    if (pending.current !== null) clearTimeout(pending.current);
    pending.current = setTimeout(() => {
      pending.current = null;
      refresh();
    }, 1500);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') refresh();
    }, REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ unreadNotifications, unreadMessages, refresh, setUnreadNotifications }),
    [unreadNotifications, unreadMessages, refresh]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
