import { useCallback } from 'react';
import { getDocuments, getSavedDocuments, type DocumentSort } from '../services/documentService';
import type { DocumentItem } from '../types';
import { usePaginatedList } from './usePaginatedList';

export interface LibraryFilters {
  search: string;
  tag: string;
  course: string;
  university: string;
  sort: DocumentSort;
  savedOnly: boolean;
}

export function useDocuments({ search, tag, course, university, sort, savedOnly }: LibraryFilters) {
  const fetchPage = useCallback(
    (page: number, size: number, signal: AbortSignal) =>
      savedOnly
        ? getSavedDocuments(page, size, signal)
        : getDocuments(page, size, { search, tag, course, university, sort }, signal),
    [search, tag, course, university, sort, savedOnly]
  );
  const list = usePaginatedList<DocumentItem>(fetchPage, 10);
  return { ...list, documents: list.items };
}
