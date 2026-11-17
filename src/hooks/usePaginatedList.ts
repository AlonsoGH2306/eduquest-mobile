import { useCallback, useEffect, useRef, useState } from 'react';
import type { PageResponse } from '../types';
import { getErrorMessage, getErrorStatus, isCanceled } from '../utils/errors';

type LoadMode = 'initial' | 'refresh' | 'more' | 'silent';

export type PageFetcher<T> = (
  page: number,
  size: number,
  signal: AbortSignal
) => Promise<PageResponse<T>>;

export function usePaginatedList<T>(fetchPage: PageFetcher<T>, pageSize = 10) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingMode, setLoadingMode] = useState<LoadMode | null>('initial');
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (targetPage: number, mode: LoadMode) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoadingMode(mode);
      if (mode !== 'more') {
        setError(null);
        setErrorStatus(null);
      }
      try {
        const response = await fetchPage(targetPage, pageSize, controller.signal);
        setItems((previous) => (targetPage === 0 ? response.content : [...previous, ...response.content]));
        setPage(targetPage);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      } catch (err) {
        if (isCanceled(err)) return;
        setError(getErrorMessage(err));
        setErrorStatus(getErrorStatus(err));
      } finally {
        if (controllerRef.current === controller) setLoadingMode(null);
      }
    },
    [fetchPage, pageSize]
  );

  useEffect(() => {
    load(0, 'initial');
    return () => controllerRef.current?.abort();
  }, [load]);

  const hasMore = page + 1 < totalPages;

  const loadMore = useCallback(() => {
    if (loadingMode !== null || !hasMore || error) return;
    load(page + 1, 'more');
  }, [loadingMode, hasMore, error, load, page]);

  const refresh = useCallback(() => load(0, 'refresh'), [load]);
  const refreshSilently = useCallback(() => load(0, 'silent'), [load]);
  const retry = useCallback(() => load(items.length > 0 ? page + 1 : 0, items.length > 0 ? 'more' : 'initial'), [
    load,
    items.length,
    page,
  ]);

  return {
    items,
    setItems,
    totalElements,
    hasMore,
    isLoading: loadingMode === 'initial',
    isRefreshing: loadingMode === 'refresh',
    isLoadingMore: loadingMode === 'more',
    error,
    errorStatus,
    loadMore,
    refresh,
    refreshSilently,
    retry,
  };
}
