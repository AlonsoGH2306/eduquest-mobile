import { useCallback, useEffect, useState } from 'react';
import { getRooms } from '../services/roomService';
import type { ChatRoom } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { useRealtimeEvents } from './useRealtime';

export function useRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getRooms(controller.signal)
      .then((data) => {
        setRooms(data);
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

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useRealtimeEvents((event) => {
    if (event.type === 'room.message' || event.type === 'room.updated') reload();
  });

  return { rooms, loading, error, reload };
}
