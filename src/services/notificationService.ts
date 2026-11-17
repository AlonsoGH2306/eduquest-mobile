import { api } from './api';
import type { AppNotification, PageResponse } from '../types';

export const getNotifications = (page: number, size: number, signal?: AbortSignal) =>
  api
    .get<PageResponse<AppNotification>>('/notifications', { params: { page, size }, signal })
    .then((r) => r.data);

export const countUnreadNotifications = (signal?: AbortSignal) =>
  api.get<{ count: number }>('/notifications/unread-count', { signal }).then((r) => r.data.count);

export const markNotificationRead = (id: number) =>
  api.patch(`/notifications/${id}/read`).then(() => undefined);

export const markAllNotificationsRead = () => api.patch('/notifications/read-all').then(() => undefined);
