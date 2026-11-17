import { api } from './api';
import type {
  ChannelSettings,
  ChannelSummary,
  DocumentItem,
  DocumentRequest,
  Group,
  GroupAppearance,
  GroupChannel,
  GroupInvite,
  GroupMember,
  GroupMessage,
  GroupRequest,
  GroupThread,
  GroupUpdateRequest,
  PageResponse,
  PollRequest,
  SavedMessage,
  SendMessagePayload,
  SessionReview,
  SessionReviewRequest,
  StudyRoom,
  StudySession,
  StudySessionRequest,
  VoiceRoom,
} from '../types';

export const getGroups = (page: number, size: number, signal?: AbortSignal, search?: string) => {
  const params: Record<string, string | number> = { page, size };
  if (search?.trim()) params.search = search.trim();
  return api.get<PageResponse<Group>>('/groups', { params, signal }).then((r) => r.data);
};

export const getMyGroups = (signal?: AbortSignal) =>
  api.get<Group[]>('/groups/mine', { signal }).then((r) => r.data);

export const markGroupSeen = (groupId: number) =>
  api.post(`/groups/${groupId}/seen`).then(() => undefined);

export const getGroup = (groupId: number, signal?: AbortSignal) =>
  api.get<Group>(`/groups/${groupId}`, { signal }).then((r) => r.data);

export const getGroupByCode = (code: string, signal?: AbortSignal) =>
  api.get<Group>(`/groups/code/${encodeURIComponent(code.trim().toUpperCase())}`, { signal }).then((r) => r.data);

export const createGroup = (payload: GroupRequest) =>
  api.post<Group>('/groups', payload).then((r) => r.data);

export const updateGroupAppearance = (groupId: number, payload: GroupAppearance) =>
  api.put<Group>(`/groups/${groupId}/appearance`, payload).then((r) => r.data);

export const joinGroup = (groupId: number, password?: string, inviteToken?: string) =>
  api
    .post<Group>(
      `/groups/${groupId}/join`,
      password !== undefined || inviteToken ? { password, inviteToken } : undefined
    )
    .then((r) => r.data);

export const createInvite = (groupId: number, regenerate = false) =>
  api.post<GroupInvite>(`/groups/${groupId}/invite`, null, { params: { regenerate } }).then((r) => r.data);

export const changeGroupPassword = (groupId: number, password: string) =>
  api.put(`/groups/${groupId}/password`, { password }).then(() => undefined);

export const getGroupMembers = (groupId: number, signal?: AbortSignal) =>
  api.get<GroupMember[]>(`/groups/${groupId}/members`, { signal }).then((r) => r.data);

export const getGroupDocuments = (
  groupId: number,
  page: number,
  size: number,
  signal?: AbortSignal
) =>
  api
    .get<PageResponse<DocumentItem>>(`/groups/${groupId}/documents`, {
      params: { page, size },
      signal,
    })
    .then((r) => r.data);

export const uploadGroupDocument = (groupId: number, payload: DocumentRequest) =>
  api.post<DocumentItem>(`/groups/${groupId}/documents`, payload).then((r) => r.data);

export const getGroupSessions = (groupId: number, signal?: AbortSignal) =>
  api.get<StudySession[]>(`/groups/${groupId}/sessions`, { signal }).then((r) => r.data);

export const scheduleSession = (groupId: number, payload: StudySessionRequest) =>
  api.post<StudySession>(`/groups/${groupId}/sessions`, payload).then((r) => r.data);

export const updateSession = (groupId: number, sessionId: number, payload: StudySessionRequest) =>
  api.put<StudySession>(`/groups/${groupId}/sessions/${sessionId}`, payload).then((r) => r.data);

export const deleteSession = (groupId: number, sessionId: number) =>
  api.delete(`/groups/${groupId}/sessions/${sessionId}`).then(() => undefined);

export const getMySessions = (from: string, to: string, signal?: AbortSignal) =>
  api.get<StudySession[]>('/sessions/mine', { params: { from, to }, signal }).then((r) => r.data);

export const checkIn = (groupId: number, sessionId: number) =>
  api.post<StudySession>(`/groups/${groupId}/sessions/${sessionId}/check-in`).then((r) => r.data);

export const setAttendance = (groupId: number, sessionId: number, attending: boolean) => {
  const url = `/groups/${groupId}/sessions/${sessionId}/attendance`;
  return (attending ? api.post<StudySession>(url) : api.delete<StudySession>(url)).then((r) => r.data);
};

export const getSessionReviews = (groupId: number, sessionId: number, signal?: AbortSignal) =>
  api.get<SessionReview[]>(`/groups/${groupId}/sessions/${sessionId}/reviews`, { signal }).then((r) => r.data);

export const reviewSession = (groupId: number, sessionId: number, payload: SessionReviewRequest) =>
  api.post<SessionReview>(`/groups/${groupId}/sessions/${sessionId}/reviews`, payload).then((r) => r.data);

export const updateRecording = (groupId: number, sessionId: number, recordingUrl: string) =>
  api
    .put<StudySession>(`/groups/${groupId}/sessions/${sessionId}/recording`, { recordingUrl })
    .then((r) => r.data);

export const getMessages = (
  groupId: number,
  cursor: { channelId?: number; after?: number; before?: number; around?: number } = {},
  signal?: AbortSignal
) => api.get<GroupMessage[]>(`/groups/${groupId}/messages`, { params: cursor, signal }).then((r) => r.data);

export const markChatSeen = (groupId: number) =>
  api.post(`/groups/${groupId}/messages/seen`).then(() => undefined);

export const sendMessage = (groupId: number, payload: SendMessagePayload) =>
  api.post<GroupMessage>(`/groups/${groupId}/messages`, payload).then((r) => r.data);

export const toggleReaction = (groupId: number, messageId: number, emoji: string) =>
  api.post<GroupMessage>(`/groups/${groupId}/messages/${messageId}/reactions`, { emoji }).then((r) => r.data);

export const setPinned = (groupId: number, messageId: number, pinned: boolean) =>
  api.put<GroupMessage>(`/groups/${groupId}/messages/${messageId}/pin`, null, { params: { pinned } }).then((r) => r.data);

export const getPinned = (groupId: number, channelId: number, signal?: AbortSignal) =>
  api.get<GroupMessage[]>(`/groups/${groupId}/messages/pins`, { params: { channelId }, signal }).then((r) => r.data);

export const getThread = (groupId: number, messageId: number, signal?: AbortSignal) =>
  api.get<GroupThread>(`/groups/${groupId}/messages/${messageId}/thread`, { signal }).then((r) => r.data);

export const searchMessages = (groupId: number, query: string, channelId?: number, signal?: AbortSignal) =>
  api
    .get<GroupMessage[]>(`/groups/${groupId}/messages/search`, { params: { q: query, channelId }, signal })
    .then((r) => r.data);

export const createPoll = (groupId: number, payload: PollRequest) =>
  api.post<GroupMessage>(`/groups/${groupId}/polls`, payload).then((r) => r.data);

export const votePoll = (groupId: number, pollId: number, optionId: number | null) =>
  api.post<GroupMessage>(`/groups/${groupId}/polls/${pollId}/vote`, { optionId }).then((r) => r.data);

export const getChannels = (groupId: number, signal?: AbortSignal) =>
  api.get<GroupChannel[]>(`/groups/${groupId}/channels`, { signal }).then((r) => r.data);

export const createChannel = (groupId: number, settings: ChannelSettings) =>
  api.post<GroupChannel>(`/groups/${groupId}/channels`, settings).then((r) => r.data);

export const updateChannel = (groupId: number, channelId: number, settings: ChannelSettings) =>
  api.put<GroupChannel>(`/groups/${groupId}/channels/${channelId}`, settings).then((r) => r.data);

export const markChannelRead = (groupId: number, channelId: number) =>
  api.post(`/groups/${groupId}/channels/${channelId}/read`).then(() => undefined);

export const summarizeChannel = (groupId: number, channelId: number) =>
  api
    .get<ChannelSummary>(`/groups/${groupId}/messages/summary`, { params: { channelId }, timeout: 60000 })
    .then((r) => r.data);

export const setSaved = (groupId: number, messageId: number, saved: boolean) =>
  api.put<GroupMessage>(`/groups/${groupId}/messages/${messageId}/saved`, null, { params: { saved } }).then((r) => r.data);

export const getSavedMessages = (signal?: AbortSignal) =>
  api.get<SavedMessage[]>('/users/me/saved-messages', { signal }).then((r) => r.data);

export const getModeration = (groupId: number, signal?: AbortSignal) =>
  api.get<{ bannedWords: string[] }>(`/groups/${groupId}/moderation`, { signal }).then((r) => r.data.bannedWords);

export const updateModeration = (groupId: number, bannedWords: string[]) =>
  api.put<{ bannedWords: string[] }>(`/groups/${groupId}/moderation`, { bannedWords }).then((r) => r.data.bannedWords);

export const getVoice = (groupId: number, signal?: AbortSignal) =>
  api.get<VoiceRoom>(`/groups/${groupId}/voice`, { signal }).then((r) => r.data);

export const setInVoice = (groupId: number, inVoice: boolean) =>
  api.post<VoiceRoom>(`/groups/${groupId}/voice/${inVoice ? 'join' : 'leave'}`).then((r) => r.data);

export const getStudyRoom = (groupId: number, signal?: AbortSignal) =>
  api.get<StudyRoom>(`/groups/${groupId}/study-room`, { signal }).then((r) => r.data);

export const startStudyRoom = (groupId: number, focusMinutes: number, breakMinutes: number) =>
  api.post<StudyRoom>(`/groups/${groupId}/study-room/start`, { focusMinutes, breakMinutes }).then((r) => r.data);

export const studyRoomAction = (groupId: number, action: 'join' | 'leave' | 'stop') =>
  api.post<StudyRoom>(`/groups/${groupId}/study-room/${action}`).then((r) => r.data);

export const deleteChannel = (groupId: number, channelId: number) =>
  api.delete(`/groups/${groupId}/channels/${channelId}`).then(() => undefined);

export const setModerator = (groupId: number, memberId: number, moderator: boolean) =>
  api.put(`/groups/${groupId}/members/${memberId}/moderator`, null, { params: { moderator } }).then(() => undefined);

export const setMuted = (groupId: number, muted: boolean) =>
  api.put(`/groups/${groupId}/mute`, null, { params: { muted } }).then(() => undefined);

export const getVoiceRoom = (groupId: number) =>
  api.get<{ url: string }>(`/groups/${groupId}/voice-room`).then((r) => r.data.url);

export const getOnlineMembers = (groupId: number, signal?: AbortSignal) =>
  api.get<{ userIds: number[] }>(`/groups/${groupId}/online`, { signal }).then((r) => r.data.userIds);

export const editMessage = (groupId: number, messageId: number, content: string) =>
  api.put<GroupMessage>(`/groups/${groupId}/messages/${messageId}`, { content }).then((r) => r.data);

export const deleteMessage = (groupId: number, messageId: number) =>
  api.delete<GroupMessage>(`/groups/${groupId}/messages/${messageId}`).then((r) => r.data);

export const updateGroup = (groupId: number, payload: GroupUpdateRequest) =>
  api.put<Group>(`/groups/${groupId}`, payload).then((r) => r.data);

export const deleteGroup = (groupId: number) => api.delete(`/groups/${groupId}`).then(() => undefined);

export const leaveGroup = (groupId: number) => api.post(`/groups/${groupId}/leave`).then(() => undefined);

export const removeMember = (groupId: number, memberId: number) =>
  api.delete(`/groups/${groupId}/members/${memberId}`).then(() => undefined);
