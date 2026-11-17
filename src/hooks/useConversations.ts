import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getConversations } from '../services/messageService';
import type { Conversation } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';

const REFRESH_INTERVAL_MS = 10_000;

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getConversations(controller.signal)
      .then((data) => {
        setConversations(data);
        setError(null);
      })
      .catch((err) => {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    reload();
  }, [reload]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') reload();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  return { conversations, loading, refreshing, error, reload, refresh };
}
