import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { setBannedHandler, setSessionExpiredHandler } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';
import { realtime } from '../services/realtime';
import { registerPushToken, unregisterPushToken } from '../utils/pushNotifications';
import type { AuthResponse, BanInfo, LoginRequest, RegisterRequest, UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  isRestoring: boolean;
  sessionExpired: boolean;
  banInfo: BanInfo | null;
  dismissBan: () => void;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  setAdvisor: (advisor: boolean) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const toProfile = (session: AuthResponse, avatarUrl?: string | null, advisor?: boolean): UserProfile => ({
  id: session.id,
  username: session.username,
  email: session.email,
  roles: session.roles,
  avatarUrl: session.avatarUrl ?? avatarUrl ?? null,
  advisor,
  emailVerified: session.emailVerified ?? true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setSessionExpired(true);
    });
    setBannedHandler((info) => {
      setUser(null);
      setSessionExpired(false);
      setBanInfo(info);
    });
    return () => {
      setSessionExpiredHandler(null);
      setBannedHandler(null);
    };
  }, []);

  const dismissBan = useCallback(() => setBanInfo(null), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [token, storedUser] = await Promise.all([
          tokenStorage.getAccessToken(),
          tokenStorage.getUser(),
        ]);
        if (!cancelled && token && storedUser) setUser(storedUser);
      } catch {
        await tokenStorage.clear();
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback(async (session: AuthResponse) => {
    await tokenStorage.saveSession(session);
    setSessionExpired(false);
    setUser(toProfile(session));
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest) => startSession(await authService.login(credentials)),
    [startSession]
  );

  const register = useCallback(
    async (payload: RegisterRequest) => startSession(await authService.register(payload)),
    [startSession]
  );

  useEffect(() => {
    if (user?.id) void registerPushToken();
  }, [user?.id]);

  const logout = useCallback(async () => {
    realtime.stop();
    await unregisterPushToken();
    await tokenStorage.clear();
    setSessionExpired(false);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profile: UserProfile) => {
    setUser(profile);
    await tokenStorage.saveUser(profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    await updateProfile(await userService.getMe());
  }, [updateProfile]);

  const saveProfileChanges = useCallback(
    async (username: string, advisor?: boolean) => {
      const session = await userService.updateProfile(username, advisor);
      await tokenStorage.saveSession(session);
      const next = toProfile(session, user?.avatarUrl, advisor ?? user?.advisor);
      setUser(next);
      await tokenStorage.saveUser(next);
    },
    [user]
  );

  const updateUsername = useCallback((username: string) => saveProfileChanges(username), [saveProfileChanges]);

  const setAdvisor = useCallback(
    async (advisor: boolean) => {
      if (user) await saveProfileChanges(user.username, advisor);
    },
    [saveProfileChanges, user]
  );

  const value = useMemo(
    () => ({
      user,
      isRestoring,
      sessionExpired,
      banInfo,
      dismissBan,
      login,
      register,
      logout,
      refreshProfile,
      updateUsername,
      setAdvisor,
      updateProfile,
    }),
    [
      user,
      isRestoring,
      sessionExpired,
      banInfo,
      dismissBan,
      login,
      register,
      logout,
      refreshProfile,
      updateUsername,
      setAdvisor,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
