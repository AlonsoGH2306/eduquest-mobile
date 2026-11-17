import { useCallback, useEffect, useState } from 'react';
import * as documentService from '../services/documentService';
import * as groupService from '../services/groupService';
import * as studyPlanService from '../services/studyPlanService';
import * as gamificationService from '../services/gamificationService';
import type { DocumentItem } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';

export interface HomeSummary {
  documents: number;
  groups: number;
  plans: number;
  recent: DocumentItem[];
  points: number | null;
  rank: number | null;
}

export function useHomeSummary() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    Promise.allSettled([
      documentService.getDocuments(0, 3, {}, controller.signal),
      groupService.getGroups(0, 1, controller.signal),
      studyPlanService.getMyPlans(controller.signal),
      gamificationService.getMyAchievements(controller.signal),
    ])
      .then(([documents, groups, plans, achievements]) => {
        if (controller.signal.aborted) return;
        if (documents.status === 'rejected' && !isCanceled(documents.reason)) {
          setError(getErrorMessage(documents.reason));
        }
        setSummary({
          documents: documents.status === 'fulfilled' ? documents.value.totalElements : 0,
          recent: documents.status === 'fulfilled' ? documents.value.content : [],
          groups: groups.status === 'fulfilled' ? groups.value.totalElements : 0,
          plans: plans.status === 'fulfilled' ? plans.value.length : 0,
          points: achievements.status === 'fulfilled' ? achievements.value.points : null,
          rank: achievements.status === 'fulfilled' ? achievements.value.rank : null,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setRefreshing(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }, []);

  return { summary, error, refreshing, refresh };
}
