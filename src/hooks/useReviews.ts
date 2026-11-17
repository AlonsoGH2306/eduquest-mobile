import { useCallback } from 'react';
import * as documentService from '../services/documentService';
import type { Review } from '../types';
import { usePaginatedList } from './usePaginatedList';

export function useReviews(documentId: number) {
  const fetchPage = useCallback(
    (page: number, size: number, signal: AbortSignal) =>
      documentService.getReviews(documentId, page, size, signal),
    [documentId]
  );
  const list = usePaginatedList<Review>(fetchPage, 10);
  const { setItems } = list;

  const addReview = useCallback(
    async (rating: number, comment: string) => {
      const created = await documentService.createReview({ documentId, rating, comment });
      setItems((previous) => [created, ...previous]);
      return created;
    },
    [documentId, setItems]
  );

  const editReview = useCallback(
    async (id: number, rating: number, comment: string) => {
      const updated = await documentService.updateReview(id, { rating, comment });
      setItems((previous) => previous.map((review) => (review.id === id ? updated : review)));
      return updated;
    },
    [setItems]
  );

  const removeReview = useCallback(
    async (id: number) => {
      await documentService.deleteReview(id);
      setItems((previous) => previous.filter((review) => review.id !== id));
    },
    [setItems]
  );

  const reviews = list.items;
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;

  return { ...list, reviews, averageRating, addReview, editReview, removeReview };
}
