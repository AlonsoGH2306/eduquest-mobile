import { api } from './api';
import type { Availability, PinnedChat, PinnedChatKind, UserStatus } from '../types';

export const updateStatus = (payload: { availability: Availability; statusText?: string; statusEmoji?: string }) =>
  api.put<UserStatus>('/users/me/status', payload).then((r) => r.data);

export const getStatuses = (ids: number[], signal?: AbortSignal) =>
  ids.length === 0
    ? Promise.resolve<UserStatus[]>([])
    : api.get<UserStatus[]>('/users/statuses', { params: { ids: ids.join(',') }, signal }).then((r) => r.data);

export const getPinnedChats = (signal?: AbortSignal) =>
  api.get<PinnedChat[]>('/users/me/pinned-chats', { signal }).then((r) => r.data);

export const setPinnedChat = (kind: PinnedChatKind, targetId: number, pinned: boolean) =>
  api.put<PinnedChat[]>('/users/me/pinned-chats', { kind, targetId, pinned }).then((r) => r.data);
