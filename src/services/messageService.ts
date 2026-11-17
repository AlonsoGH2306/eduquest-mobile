import { api } from './api';
import type { Conversation, DirectMessage, SendMessagePayload, UserSummary } from '../types';

export const getConversations = (signal?: AbortSignal) =>
  api.get<Conversation[]>('/conversations', { signal }).then((r) => r.data);

export const countUnreadMessages = (signal?: AbortSignal) =>
  api.get<{ count: number }>('/conversations/unread-count', { signal }).then((r) => r.data.count);

export const searchUsers = (search: string, signal?: AbortSignal) =>
  api.get<UserSummary[]>('/conversations/contacts', { params: { search }, signal }).then((r) => r.data);

export const getUserSummary = (userId: number, signal?: AbortSignal) =>
  api.get<UserSummary>(`/conversations/contacts/${userId}`, { signal }).then((r) => r.data);

export const getDirectMessages = (
  userId: number,
  cursor: { after?: number; before?: number } = {},
  signal?: AbortSignal
) => api.get<DirectMessage[]>(`/conversations/${userId}/messages`, { params: cursor, signal }).then((r) => r.data);

export const sendDirectMessage = (userId: number, payload: SendMessagePayload) =>
  api.post<DirectMessage>(`/conversations/${userId}/messages`, payload).then((r) => r.data);

export const editDirectMessage = (userId: number, messageId: number, content: string) =>
  api.put<DirectMessage>(`/conversations/${userId}/messages/${messageId}`, { content }).then((r) => r.data);

export const deleteDirectMessage = (userId: number, messageId: number) =>
  api.delete<DirectMessage>(`/conversations/${userId}/messages/${messageId}`).then((r) => r.data);

export const markConversationRead = (userId: number) =>
  api.post(`/conversations/${userId}/read`).then(() => undefined);
