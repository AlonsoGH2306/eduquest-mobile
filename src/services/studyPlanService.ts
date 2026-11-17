import { api } from './api';
import type { StudyPlan, StudyPlanRequest } from '../types';

export const getMyPlans = (signal?: AbortSignal) =>
  api.get<StudyPlan[]>('/study-plans', { signal }).then((r) => r.data);

export const generatePlan = (payload: StudyPlanRequest) =>
  api.post<StudyPlan>('/study-plans/generate', payload, { timeout: 60000 }).then((r) => r.data);

export const updateProgress = (planId: number, completedSteps: number[]) =>
  api.put<StudyPlan>(`/study-plans/${planId}/progress`, { completedSteps }).then((r) => r.data);

export const deletePlan = (planId: number) => api.delete(`/study-plans/${planId}`).then(() => undefined);
