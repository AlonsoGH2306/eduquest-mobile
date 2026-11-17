import { useCallback, useEffect, useState } from 'react';
import * as groupService from '../services/groupService';
import type { StudyRoom, UserSummary } from '../types';
import { useToast } from './useContexts';
import { getErrorMessage } from '../utils/errors';
import { useRealtimeEvents } from './useRealtime';

export function useGroupLive(groupId: number, enabled: boolean) {
  const { showToast } = useToast();
  const [voice, setVoice] = useState<UserSummary[]>([]);
  const [studyRoom, setStudyRoom] = useState<StudyRoom | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    groupService
      .getVoice(groupId, controller.signal)
      .then((room) => setVoice(room.participants))
      .catch(() => undefined);
    groupService
      .getStudyRoom(groupId, controller.signal)
      .then(setStudyRoom)
      .catch(() => undefined);
    return () => controller.abort();
  }, [groupId, enabled]);

  useRealtimeEvents((event) => {
    if (event.type === 'group.voice' && event.groupId === groupId) setVoice(event.participants as UserSummary[]);
    if (event.type === 'group.studyroom' && event.groupId === groupId) setStudyRoom(event.room as StudyRoom);
  });

  const run = useCallback(
    async <T,>(action: () => Promise<T>) => {
      setBusy(true);
      try {
        return await action();
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [showToast]
  );

  const joinVoice = useCallback(async () => {
    const room = await run(() => groupService.setInVoice(groupId, true));
    if (!room) return null;
    setVoice(room.participants);
    return room.url;
  }, [groupId, run]);

  const leaveVoice = useCallback(async () => {
    const room = await run(() => groupService.setInVoice(groupId, false));
    if (room) setVoice(room.participants);
  }, [groupId, run]);

  const startStudy = useCallback(
    async (focusMinutes: number, breakMinutes: number) => {
      const room = await run(() => groupService.startStudyRoom(groupId, focusMinutes, breakMinutes));
      if (room) setStudyRoom(room);
    },
    [groupId, run]
  );

  const studyAction = useCallback(
    async (action: 'join' | 'leave' | 'stop') => {
      const room = await run(() => groupService.studyRoomAction(groupId, action));
      if (room) setStudyRoom(room);
    },
    [groupId, run]
  );

  return { voice, studyRoom, busy, joinVoice, leaveVoice, startStudy, studyAction };
}
