import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { tokenStorage } from './tokenStorage';
import type { AuthResponse, BanInfo } from '../types';

const BACKEND_PORT = 8080;
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '10.0.2.2'];

const getMetroHost = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const host = hostUri.split(':')[0];
  return host || null;
};

const resolveApiUrl = (): string => {
  const metroHost = getMetroHost();
  const fallback = `http://${metroHost ?? 'localhost'}:${BACKEND_PORT}/api/v1`;
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (!configured || configured === 'auto') return fallback;
  if (metroHost && __DEV__) {
    try {
      const { hostname } = new URL(configured);
      if (LOOPBACK_HOSTS.includes(hostname)) return configured.replace(hostname, metroHost);
    } catch {
      return fallback;
    }
  }
  return configured;
};

export const API_URL = resolveApiUrl();
export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 700;

type RetriableConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
  _refreshed?: boolean;
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let sessionExpiredHandler: (() => void) | null = null;
let bannedHandler: ((info: BanInfo) => void) | null = null;

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  sessionExpiredHandler = handler;
};

export const setBannedHandler = (handler: ((info: BanInfo) => void) | null) => {
  bannedHandler = handler;
};

interface BannedProblem {
  code?: string;
  banReason?: string | null;
  bannedAt?: string | null;
  bannedUntil?: string | null;
}

export const getBanInfo = (error: unknown): BanInfo | null => {
  if (!axios.isAxiosError<BannedProblem>(error)) return null;
  const data = error.response?.data;
  if (error.response?.status !== 403 || data?.code !== 'USER_BANNED') return null;
  return { reason: data.banReason ?? null, bannedAt: data.bannedAt ?? null, bannedUntil: data.bannedUntil ?? null };
};

const notifyBanned = async (info: BanInfo) => {
  await tokenStorage.clear();
  bannedHandler?.(info);
};

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRecoverable = (error: AxiosError, config: RetriableConfig) => {
  const method = (config.method ?? 'get').toLowerCase();
  if (method !== 'get') return false;
  if (!error.response) return true;
  return [502, 503, 504].includes(error.response.status);
};

const isAuthEndpoint = (url?: string) =>
  Boolean(url && /\/auth\/(login|register|refresh)/.test(url));

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
  const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken });
  await tokenStorage.saveSession(data);
  return data.token;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (axios.isCancel(error) || !error.config) {
      return Promise.reject(error);
    }

    const config = error.config as RetriableConfig;

    const banInfo = getBanInfo(error);
    if (banInfo) {
      await notifyBanned(banInfo);
      return Promise.reject(error);
    }

    if (isRecoverable(error, config) && (config._retryCount ?? 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      await wait(RETRY_BASE_DELAY_MS * 2 ** (config._retryCount - 1));
      return api(config);
    }

    if (error.response?.status === 401 && !config._refreshed && !isAuthEndpoint(config.url)) {
      config._refreshed = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const newToken = await refreshPromise;
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      } catch (refreshError) {
        const refreshBan = getBanInfo(refreshError);
        if (refreshBan) {
          await notifyBanned(refreshBan);
          return Promise.reject(refreshError);
        }
        await tokenStorage.clear();
        sessionExpiredHandler?.();
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);
