import { useCallback, useState } from 'react';
import * as groupService from '../services/groupService';
import type { StudySession, StudySessionRequest } from '../types';

export function useSessionActions(groupId: number) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveSession = useCallback(
    async (payload: StudySessionRequest, sessionId?: number): Promise<StudySession> => {
      setSaving(true);
      try {
        return sessionId
          ? await groupService.updateSession(groupId, sessionId, payload)
          : await groupService.scheduleSession(groupId, payload);
      } finally {
        setSaving(false);
      }
    },
    [groupId]
  );

  const removeSession = useCallback(
    async (sessionId: number) => {
      setDeleting(true);
      try {
        await groupService.deleteSession(groupId, sessionId);
      } finally {
        setDeleting(false);
      }
    },
    [groupId]
  );

  return { saveSession, removeSession, saving, deleting };
}
