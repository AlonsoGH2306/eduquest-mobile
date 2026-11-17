import { api } from './api';
import type { GamificationProfile, LeaderboardEntry, LeaderboardPeriod } from '../types';

export const getMyAchievements = (signal?: AbortSignal) =>
  api.get<GamificationProfile>('/gamification/me', { signal }).then((r) => r.data);

export const getLeaderboard = (period: LeaderboardPeriod, signal?: AbortSignal) =>
  api.get<LeaderboardEntry[]>('/gamification/leaderboard', { params: { period }, signal }).then((r) => r.data);
