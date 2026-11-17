import { api } from './api';
import type { AuthResponse, DocumentItem, PageResponse, PublicProfile, UserProfile, UserSummary } from '../types';

export interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

export const getMe = (signal?: AbortSignal) =>
  api.get<UserProfile>('/users/me', { signal }).then((r) => r.data);

export const updateProfile = (username: string, advisor?: boolean) =>
  api.patch<AuthResponse>('/users/me', { username, advisor }).then((r) => r.data);

export const uploadAvatar = (image: ImageFile) => {
  const form = new FormData();
  form.append('file', image as unknown as Blob);
  return api
    .put<UserProfile>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    })
    .then((r) => r.data);
};

export const deleteAvatar = () => api.delete<void>('/users/me/avatar').then(() => undefined);

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.patch('/users/me/password', { currentPassword, newPassword }).then(() => undefined);

export const getPublicProfile = (userId: number, signal?: AbortSignal) =>
  api.get<PublicProfile>(`/users/${userId}/profile`, { signal }).then((r) => r.data);

export const getPublicDocuments = (userId: number, page = 0, size = 10, signal?: AbortSignal) =>
  api
    .get<PageResponse<DocumentItem>>(`/users/${userId}/documents`, { params: { page, size }, signal })
    .then((r) => r.data);

export const followUser = (userId: number) => api.post(`/users/${userId}/follow`).then(() => undefined);

export const unfollowUser = (userId: number) => api.delete(`/users/${userId}/follow`).then(() => undefined);

export const getFollowing = (signal?: AbortSignal) =>
  api.get<UserSummary[]>('/users/me/following', { signal }).then((r) => r.data);
