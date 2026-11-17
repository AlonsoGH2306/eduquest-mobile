import { api } from './api';
import type { Report, ReportRequest } from '../types';

export const createReport = (payload: ReportRequest) =>
  api.post<Report>('/reports', payload).then((r) => r.data);
