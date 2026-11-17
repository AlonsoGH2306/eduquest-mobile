import { useCallback, useEffect, useState } from 'react';
import * as groupService from '../services/groupService';
import type { Group, GroupMember, GroupUpdateRequest, SessionReviewRequest, StudySession } from '../types';
import { cancelSessionReminder, scheduleSessionReminder, syncSessionReminders } from '../utils/sessionReminders';
import { getErrorMessage, isCanceled } from '../utils/errors';
import { usePaginatedList } from './usePaginatedList';

export function useGroupDetail(groupId: number, initialGroup?: Group) {
  const [group, setGroup] = useState<Group | null>(initialGroup ?? null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchDocuments = useCallback(
    (page: number, size: number, signal: AbortSignal) =>
      groupService.getGroupDocuments(groupId, page, size, signal),
    [groupId]
  );
  const documents = usePaginatedList(fetchDocuments, 10);
  const { refresh: refreshDocuments } = documents;
  const isMember = documents.errorStatus === 403 ? false : group ? group.member : true;

  useEffect(() => {
    const controller = new AbortController();
    groupService
      .getGroup(groupId, controller.signal)
      .then((data) => {
        setGroup(data);
        setGroupError(null);
      })
      .catch((err) => {
        if (!isCanceled(err)) setGroupError(getErrorMessage(err));
      });
    return () => controller.abort();
  }, [groupId]);

  useEffect(() => {
    if (!isMember) {
      setSessionsLoading(false);
      return;
    }
    const controller = new AbortController();
    setSessionsLoading(true);
    setSessionsError(null);
    groupService
      .getGroupSessions(groupId, controller.signal)
      .then((data) => {
        setSessions(
          [...data].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        );
        syncSessionReminders(data, initialGroup?.name).catch(() => undefined);
      })
      .catch((err) => {
        if (!isCanceled(err)) setSessionsError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setSessionsLoading(false);
      });
    return () => controller.abort();
  }, [groupId, isMember, reloadKey]);

  useEffect(() => {
    if (!isMember) {
      setMembersLoading(false);
      return;
    }
    const controller = new AbortController();
    setMembersLoading(true);
    setMembersError(null);
    groupService
      .getGroupMembers(groupId, controller.signal)
      .then(setMembers)
      .catch((err) => {
        if (!isCanceled(err)) setMembersError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setMembersLoading(false);
      });
    return () => controller.abort();
  }, [groupId, isMember, reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
    refreshDocuments();
  }, [refreshDocuments]);

  const replaceSession = useCallback(
    (updated: StudySession) =>
      setSessions((previous) => previous.map((session) => (session.id === updated.id ? updated : session))),
    []
  );

  const toggleAttendance = useCallback(
    async (session: StudySession) => {
      const updated = await groupService.setAttendance(groupId, session.id, !session.attending);
      replaceSession(updated);
      if (updated.attending) {
        return scheduleSessionReminder(updated, group?.name);
      }
      await cancelSessionReminder(updated.id);
      return false;
    },
    [groupId, group?.name, replaceSession]
  );

  const checkIn = useCallback(
    async (session: StudySession) => {
      replaceSession(await groupService.checkIn(groupId, session.id));
    },
    [groupId, replaceSession]
  );

  const reviewSession = useCallback(
    async (session: StudySession, payload: SessionReviewRequest) => {
      const review = await groupService.reviewSession(groupId, session.id, payload);
      const count = session.reviewCount + 1;
      replaceSession({
        ...session,
        reviewCount: count,
        averageRating: ((session.averageRating ?? 0) * session.reviewCount + payload.rating) / count,
        reviewedByMe: true,
        canReview: false,
      });
      return review;
    },
    [groupId, replaceSession]
  );

  const updateRecording = useCallback(
    async (session: StudySession, recordingUrl: string) => {
      replaceSession(await groupService.updateRecording(groupId, session.id, recordingUrl));
    },
    [groupId, replaceSession]
  );

  const updateGroup = useCallback(
    async (payload: GroupUpdateRequest) => {
      setGroup(await groupService.updateGroup(groupId, payload));
    },
    [groupId]
  );

  const setModerator = useCallback(
    async (memberId: number, moderator: boolean) => {
      await groupService.setModerator(groupId, memberId, moderator);
      setMembers((current) =>
        current.map((member) =>
          member.id === memberId ? { ...member, groupRole: moderator ? 'MODERATOR' : 'MEMBER' } : member
        )
      );
    },
    [groupId]
  );

  const setMuted = useCallback(
    async (muted: boolean) => {
      await groupService.setMuted(groupId, muted);
      setGroup((current) => (current ? { ...current, muted } : current));
    },
    [groupId]
  );

  const removeMember = useCallback(
    async (memberId: number) => {
      await groupService.removeMember(groupId, memberId);
      setMembers((current) => current.filter((member) => member.id !== memberId));
      setGroup((current) => (current ? { ...current, memberCount: Math.max(current.memberCount - 1, 1) } : current));
    },
    [groupId]
  );

  const markJoined = useCallback(
    (joined: Group) => {
      setGroup(joined);
      setGroupError(null);
      reload();
    },
    [reload]
  );

  return {
    group,
    groupError,
    documents,
    sessions,
    sessionsLoading,
    sessionsError,
    members,
    membersLoading,
    membersError,
    isMember,
    markJoined,
    reload,
    toggleAttendance,
    checkIn,
    reviewSession,
    updateRecording,
    updateGroup,
    removeMember,
    setModerator,
    setMuted,
  };
}
