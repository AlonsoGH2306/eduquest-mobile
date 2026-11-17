import { useCallback } from 'react';
import { getGroups } from '../services/groupService';
import type { Group } from '../types';
import { usePaginatedList } from './usePaginatedList';

export function useGroups(search = '') {
  const fetchPage = useCallback(
    (page: number, size: number, signal: AbortSignal) => getGroups(page, size, signal, search),
    [search]
  );
  const list = usePaginatedList<Group>(fetchPage, 10);
  return { ...list, groups: list.items };
}
