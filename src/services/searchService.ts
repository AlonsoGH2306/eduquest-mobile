import { api } from './api';
import type { GlobalSearchResult } from '../types';

export const globalSearch = (query: string, signal?: AbortSignal) =>
  api.get<GlobalSearchResult>('/search', { params: { q: query }, signal }).then((r) => r.data);
