import { api } from './api';
import type { ForumAnswer, ForumFilter, ForumQuestion, ForumThread, PageResponse } from '../types';

export const getQuestions = (
  query: { search?: string; course?: string; filter?: ForumFilter; page: number; size: number },
  signal?: AbortSignal
) => api.get<PageResponse<ForumQuestion>>('/forum/questions', { params: query, signal }).then((r) => r.data);

export const askQuestion = (title: string, body: string, course: string) =>
  api.post<ForumQuestion>('/forum/questions', { title, body, course }).then((r) => r.data);

export const getThread = (questionId: number, signal?: AbortSignal) =>
  api.get<ForumThread>(`/forum/questions/${questionId}`, { signal }).then((r) => r.data);

export const deleteQuestion = (questionId: number) =>
  api.delete(`/forum/questions/${questionId}`).then(() => undefined);

export const answerQuestion = (questionId: number, body: string) =>
  api.post<ForumAnswer>(`/forum/questions/${questionId}/answers`, { body }).then((r) => r.data);

export const deleteAnswer = (answerId: number) => api.delete(`/forum/answers/${answerId}`).then(() => undefined);

export const voteAnswer = (answerId: number, value: number) =>
  api.post<ForumAnswer>(`/forum/answers/${answerId}/vote`, { value }).then((r) => r.data);

export const acceptAnswer = (questionId: number, answerId: number) =>
  api.post<ForumThread>(`/forum/questions/${questionId}/answers/${answerId}/accept`).then((r) => r.data);
