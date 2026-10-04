import { AuthUser, AuthSession } from '../types';
import { apiGet, apiPost, ApiError } from './api';

// Authentication is handled entirely by the server (httpOnly session cookie, hashed passwords,
// account lockout). This module is a thin client for it.

const EMPTY_SESSION: AuthSession = { user: null, isAuthenticated: false, loginTime: null, expiresAt: null };

export async function fetchCurrentSession(): Promise<AuthSession> {
  try {
    const res = await apiGet<{ user: AuthUser | null; expiresAt?: number }>('/auth/me');
    if (!res.user) return EMPTY_SESSION;
    return { user: res.user, isAuthenticated: true, loginTime: res.user.lastLogin, expiresAt: res.expiresAt ?? null };
  } catch {
    return EMPTY_SESSION;
  }
}

export async function authenticateUser(
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await apiPost<{ user: AuthUser }>('/auth/login', { identifier, password });
    return { success: true, user: res.user };
  } catch (e) {
    return { success: false, error: e instanceof ApiError ? e.message : 'Sign-in failed. Please try again.' };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await apiPost('/auth/logout');
  } catch {
    /* session cookie is cleared server-side; ignore network errors */
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiPost('/auth/change-password', { currentPassword, newPassword });
}
