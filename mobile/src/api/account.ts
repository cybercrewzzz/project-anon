import { apiClient } from './client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Language {
  languageId: string;
  code: string;
  name: string;
}

export interface AccountProfile {
  accountId: string;
  email: string;
  name: string | null;
  nickname: string;
  ageRange: string;
  gender: string;
  status: string;
  createdAt: string;
  interfaceLanguage: Language | null;
  languages: Language[];
  roles: string[];
}

export interface UpdateAccountDto {
  name?: string;
  interfaceLanguageId?: string;
  languageIds?: string[];
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterDeviceTokenDto {
  fcmToken: string;
  platform: 'ios' | 'android' | 'web';
}

// ─── Account ────────────────────────────────────────────────────────────────

/**
 * GET /account/me — Fetch the authenticated user's profile.
 */
export async function getMe(): Promise<AccountProfile> {
  const { data } = await apiClient.get<AccountProfile>('/account/me');
  return data;
}

/**
 * PATCH /account/me — Update profile fields and/or spoken languages.
 */
export async function updateMe(dto: UpdateAccountDto): Promise<AccountProfile> {
  const { data } = await apiClient.patch<AccountProfile>('/account/me', dto);
  return data;
}

/**
 * PATCH /account/me/password — Change the authenticated user's password.
 */
export async function changePassword(dto: ChangePasswordDto): Promise<{ message: string }> {
  const { data } = await apiClient.patch<{ message: string }>(
    '/account/me/password',
    dto,
  );
  return data;
}

// ─── Device Token ────────────────────────────────────────────────────────────

/**
 * POST /device/token — Register a device FCM token for push notifications.
 */
export async function registerDeviceToken(
  dto: RegisterDeviceTokenDto,
): Promise<{ deviceId: string }> {
  const { data } = await apiClient.post<{ deviceId: string }>(
    '/device/token',
    dto,
  );
  return data;
}

/**
 * DELETE /device/token — Remove a device FCM token (e.g. on logout).
 */
export async function removeDeviceToken(fcmToken: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>('/device/token', {
    data: { fcmToken },
  });
  return data;
}
