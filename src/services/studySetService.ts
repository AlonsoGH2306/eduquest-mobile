import { api } from './api';
import type { StudySet, StudySetType } from '../types';

export const getStudySet = (documentId: number, type: StudySetType, refresh = false) =>
  api
    .post<StudySet>(`/documents/${documentId}/study-set`, null, { params: { type, refresh }, timeout: 90000 })
    .then((r) => r.data);
