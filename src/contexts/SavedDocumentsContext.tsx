import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import * as documentService from '../services/documentService';

interface SavedDocumentsContextValue {
  isSaved: (documentId: number) => boolean;
  toggleSaved: (documentId: number) => Promise<boolean>;
}

export const SavedDocumentsContext = createContext<SavedDocumentsContextValue | null>(null);

export function SavedDocumentsProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    documentService
      .getSavedIds(controller.signal)
      .then((ids) => setSavedIds(new Set(ids)))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const update = (documentId: number, saved: boolean) =>
    setSavedIds((current) => {
      const next = new Set(current);
      if (saved) next.add(documentId);
      else next.delete(documentId);
      return next;
    });

  const isSaved = useCallback((documentId: number) => savedIds.has(documentId), [savedIds]);

  const toggleSaved = useCallback(
    async (documentId: number) => {
      const saved = !savedIds.has(documentId);
      update(documentId, saved);
      try {
        await documentService.setSaved(documentId, saved);
        return saved;
      } catch (err) {
        update(documentId, !saved);
        throw err;
      }
    },
    [savedIds]
  );

  const value = useMemo(() => ({ isSaved, toggleSaved }), [isSaved, toggleSaved]);

  return <SavedDocumentsContext.Provider value={value}>{children}</SavedDocumentsContext.Provider>;
}
