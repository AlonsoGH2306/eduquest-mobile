import { api } from './api';
import type { AuthResponse, BanAppeal, LoginRequest, RegisterRequest, ResetPasswordRequest, UserProfile } from '../types';

export const login = (credentials: LoginRequest) =>
  api.post<AuthResponse>('/auth/login', credentials).then((r) => r.data);

export const register = (payload: RegisterRequest) =>
  api.post<AuthResponse>('/auth/register', payload).then((r) => r.data);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email }).then(() => undefined);

export const resetPassword = (payload: ResetPasswordRequest) =>
  api.post('/auth/reset-password', payload).then(() => undefined);

export const submitAppeal = (username: string, password: string, message: string) =>
  api.post<BanAppeal>('/auth/appeals', { username, password, message }).then((r) => r.data);

export const verifyEmail = (code: string) =>
  api.post<UserProfile>('/users/me/verify-email', { code }).then((r) => r.data);

export const resendVerification = () => api.post('/users/me/verify-email/resend').then(() => undefined);
