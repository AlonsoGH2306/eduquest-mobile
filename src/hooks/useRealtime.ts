import { useCallback, useEffect, useRef, useState } from 'react';
import { realtime, RealtimeEvent } from '../services/realtime';

const TYPING_VISIBLE_MS = 4000;
const TYPING_SEND_EVERY_MS = 2500;

export function useRealtimeEvents(handler: (event: RealtimeEvent) => void, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    return realtime.subscribe((event) => handlerRef.current(event));
  }, [enabled]);
}

export function useRealtimeConnected() {
  const [connected, setConnected] = useState(realtime.connected);
  useEffect(() => realtime.onStatus(setConnected), []);
  return connected;
}

export function useTyping(target: { groupId: number } | { userId: number }) {
  const [typing, setTyping] = useState<Record<number, { username: string; until: number }>>({});
  const lastSent = useRef(0);
  const targetRef = useRef(target);
  targetRef.current = target;

  useRealtimeEvents((event) => {
    if (event.type !== 'typing') return;
    const current = targetRef.current;
    const matches = 'groupId' in current ? event.groupId === current.groupId : !event.groupId && event.userId === current.userId;
    if (!matches) return;
    setTyping((state) => ({ ...state, [event.userId]: { username: event.username, until: Date.now() + TYPING_VISIBLE_MS } }));
  });

  useEffect(() => {
    if (Object.keys(typing).length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setTyping((state) => Object.fromEntries(Object.entries(state).filter(([, value]) => value.until > now)));
    }, 1000);
    return () => clearTimeout(timer);
  }, [typing]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSent.current < TYPING_SEND_EVERY_MS) return;
    lastSent.current = now;
    realtime.send({ type: 'typing', ...targetRef.current });
  }, []);

  const clearSelf = useCallback((userId: number) => {
    setTyping((state) => {
      if (!(userId in state)) return state;
      const next = { ...state };
      delete next[userId];
      return next;
    });
  }, []);

  return { typingNames: Object.values(typing).map((value) => value.username), notifyTyping, clearSelf };
}

export const typingLabel = (names: string[]) => {
  if (names.length === 0) return null;
  if (names.length === 1) return `@${names[0]} está escribiendo…`;
  if (names.length === 2) return `@${names[0]} y @${names[1]} están escribiendo…`;
  return 'Varias personas están escribiendo…';
};
