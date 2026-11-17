import { useCallback, useEffect, useState } from 'react';
import * as gamificationService from '../services/gamificationService';
import type { GamificationProfile, LeaderboardEntry, LeaderboardPeriod } from '../types';
import { getErrorMessage, isCanceled } from '../utils/errors';

export function useAchievements(period: LeaderboardPeriod) {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    gamificationService
      .getMyAchievements(controller.signal)
      .then(setProfile)
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

  useEffect(() => {
    const controller = new AbortController();
    setLeaderboardLoading(true);
    gamificationService
      .getLeaderboard(period, controller.signal)
      .then(setLeaderboard)
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLeaderboardLoading(false);
      });
    return () => controller.abort();
  }, [period, reloadKey]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }, []);

  return { profile, leaderboard, loading, leaderboardLoading, refreshing, error, refresh, retry };
}
