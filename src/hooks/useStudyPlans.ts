import { useCallback, useEffect, useState } from 'react';
import * as studyPlanService from '../services/studyPlanService';
import type { CourseInput, StudyPlan } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';

export function useStudyPlans() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    studyPlanService
      .getMyPlans(controller.signal)
      .then((data) =>
        setPlans([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      )
      .catch((err) => {
        if (!isCanceled(err)) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => controller.abort();
  }, [reloadKey]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }, []);

  const generate = useCallback(async (courses: CourseInput[]) => {
    setGenerating(true);
    try {
      const created = await studyPlanService.generatePlan({ courses });
      setPlans((previous) => [created, ...previous]);
      return created;
    } finally {
      setGenerating(false);
    }
  }, []);

  const replacePlan = useCallback(
    (updated: StudyPlan) => setPlans((previous) => previous.map((plan) => (plan.id === updated.id ? updated : plan))),
    []
  );

  const toggleStep = useCallback(
    async (plan: StudyPlan, stepIndex: number) => {
      const done = new Set(plan.completedSteps);
      if (done.has(stepIndex)) done.delete(stepIndex);
      else done.add(stepIndex);
      const completedSteps = [...done].sort((a, b) => a - b);
      replacePlan({ ...plan, completedSteps });
      try {
        replacePlan(await studyPlanService.updateProgress(plan.id, completedSteps));
      } catch (err) {
        replacePlan(plan);
        throw err;
      }
    },
    [replacePlan]
  );

  const deletePlan = useCallback(async (planId: number) => {
    await studyPlanService.deletePlan(planId);
    setPlans((previous) => previous.filter((plan) => plan.id !== planId));
  }, []);

  return { plans, loading, refreshing, error, generating, generate, toggleStep, deletePlan, refresh, retry };
}
