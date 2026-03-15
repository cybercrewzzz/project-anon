import { apiClient } from './client';
import type { AuthResponse } from './types';

/**
 * POST /auth/login — Login for all roles (user, volunteer, admin).
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

/**
 * POST /auth/register — Register a new user (seeker) account.
 */
export async function registerUser(body: {
  email: string;
  password: string;
  ageRange: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/auth/register',
    body,
  );
  return data;
}

/**
 * POST /auth/register/volunteer — Register a new volunteer account.
 */
export async function registerVolunteer(body: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/auth/register/volunteer',
    body,
  );
  return data;
}

/**
 * POST /auth/logout — Revoke the current refresh token.
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}
