import * as SecureStore from 'expo-secure-store';
import type { AuthResponse, UserProfile } from '../types';

const ACCESS_KEY = 'eduquest_access_token';
const REFRESH_KEY = 'eduquest_refresh_token';
const USER_KEY = 'eduquest_user';

let cachedAccessToken: string | null = null;

export const tokenStorage = {
  async saveSession(session: AuthResponse): Promise<void> {
    const user: UserProfile = {
      id: session.id,
      username: session.username,
      email: session.email,
      roles: session.roles,
      avatarUrl: session.avatarUrl ?? null,
      emailVerified: session.emailVerified ?? true,
    };
    cachedAccessToken = session.token;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, session.token),
      SecureStore.setItemAsync(REFRESH_KEY, session.refreshToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    if (cachedAccessToken) return cachedAccessToken;
    cachedAccessToken = await SecureStore.getItemAsync(ACCESS_KEY);
    return cachedAccessToken;
  },

  getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },

  saveUser(user: UserProfile): Promise<void> {
    return SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<UserProfile | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    cachedAccessToken = null;
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },
};
