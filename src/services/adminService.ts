import { api } from './api';
import type { AnnouncementRequest, AppealStatus, BanAppeal, PageResponse, Report, ReportStatus, UserProfile } from '../types';
import type { RoleName } from '../utils/roles';

export const getUsers = (page: number, size: number, signal?: AbortSignal) =>
  api
    .get<PageResponse<UserProfile>>('/admin/users', { params: { page, size }, signal })
    .then((r) => r.data);

export const banUser = (userId: number, reason: string, days: number | null = null) =>
  api.patch<UserProfile>(`/admin/users/${userId}/ban`, { reason, days }).then((r) => r.data);

export const unbanUser = (userId: number) =>
  api.patch<UserProfile>(`/admin/users/${userId}/unban`).then((r) => r.data);

export const updateUserRole = (userId: number, role: RoleName) =>
  api
    .patch<UserProfile>(`/admin/users/${userId}/role`, null, { params: { role } })
    .then((r) => r.data);

export const getReports = (status: ReportStatus, page: number, size: number, signal?: AbortSignal) =>
  api
    .get<PageResponse<Report>>('/admin/reports', { params: { status, page, size }, signal })
    .then((r) => r.data);

export const closeReport = (reportId: number, status: Exclude<ReportStatus, 'OPEN'>) =>
  api.patch<Report>(`/admin/reports/${reportId}`, { status }).then((r) => r.data);

export const deleteDocument = (documentId: number) =>
  api.delete(`/admin/documents/${documentId}`).then(() => undefined);

export const sendAnnouncement = (request: AnnouncementRequest) =>
  api.post<{ recipients: number }>('/admin/notifications', request).then((r) => r.data.recipients);

export const getAppeals = (status: AppealStatus, page: number, size: number, signal?: AbortSignal) =>
  api
    .get<PageResponse<BanAppeal>>('/admin/appeals', { params: { status, page, size }, signal })
    .then((r) => r.data);

export const decideAppeal = (appealId: number, accepted: boolean, response: string) =>
  api.patch<BanAppeal>(`/admin/appeals/${appealId}`, { accepted, response }).then((r) => r.data);
