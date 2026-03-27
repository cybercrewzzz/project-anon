import { apiClient } from './client';
import type { AuthResponse, AgeRange } from './types';

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
  ageRange: AgeRange;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', body);
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

/**
 * POST /auth/forgot-password — Send OTP to email.
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', {
    email,
  });
  return data;
}

/**
 * POST /auth/verify-otp — Verify OTP and get reset token.
 */
export async function verifyOtp(
  email: string,
  otp: string,
): Promise<{ resetToken: string }> {
  const { data } = await apiClient.post<{ resetToken: string }>('/auth/verify-otp', {
    email,
    otp,
  });
  return data;
}

/**
 * POST /auth/reset-password — Reset password using reset token.
 */
export async function resetPassword(body: {
  email: string;
  resetToken: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', body);
  return data;
}

