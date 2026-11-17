import { api } from './api';
import type {
  DocumentItem,
  DocumentRequest,
  PageResponse,
  Review,
  ReviewRequest,
  ReviewUpdateRequest,
  UploadedFile,
} from '../types';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export type DocumentSort = 'recent' | 'oldest' | 'title';

export interface DocumentFilters {
  search?: string;
  tag?: string;
  course?: string;
  university?: string;
  sort?: DocumentSort;
}

export const getDocuments = (
  page: number,
  size: number,
  filters: DocumentFilters = {},
  signal?: AbortSignal
) => {
  const params: Record<string, string | number> = { page, size, sort: filters.sort ?? 'recent' };
  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.tag?.trim()) params.tag = filters.tag.trim();
  if (filters.course?.trim()) params.course = filters.course.trim();
  if (filters.university?.trim()) params.university = filters.university.trim();
  return api
    .get<PageResponse<DocumentItem>>('/documents', { params, signal })
    .then((r) => r.data);
};

export const createDocument = (payload: DocumentRequest) =>
  api.post<DocumentItem>('/documents', payload).then((r) => r.data);

export const getReviews = (documentId: number, page: number, size: number, signal?: AbortSignal) =>
  api
    .get<PageResponse<Review>>(`/documents/${documentId}/reviews`, {
      params: { page, size },
      signal,
    })
    .then((r) => r.data);

export const createReview = (payload: ReviewRequest) =>
  api.post<Review>('/reviews', payload).then((r) => r.data);

export const updateReview = (id: number, payload: ReviewUpdateRequest) =>
  api.put<Review>(`/reviews/${id}`, payload).then((r) => r.data);

export const deleteReview = (id: number) => api.delete<void>(`/reviews/${id}`).then(() => undefined);

export const getSavedDocuments = (page: number, size: number, signal?: AbortSignal) =>
  api
    .get<PageResponse<DocumentItem>>('/documents/saved', { params: { page, size }, signal })
    .then((r) => r.data);

export const getSavedIds = (signal?: AbortSignal) =>
  api.get<number[]>('/documents/saved/ids', { signal }).then((r) => r.data);

export const setSaved = (documentId: number, saved: boolean) =>
  (saved
    ? api.post(`/documents/${documentId}/saved`)
    : api.delete(`/documents/${documentId}/saved`)
  ).then(() => undefined);

export const updateDocument = (documentId: number, payload: DocumentRequest) =>
  api.put<DocumentItem>(`/documents/${documentId}`, payload).then((r) => r.data);

export const deleteDocument = (documentId: number) =>
  api.delete(`/documents/${documentId}`).then(() => undefined);

export const uploadFile = (file: PickedFile, onProgress?: (percent: number) => void) => {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
  return api
    .post<UploadedFile>('/files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    })
    .then((r) => r.data);
};
