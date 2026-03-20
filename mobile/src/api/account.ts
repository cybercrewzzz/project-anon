import { apiClient } from './client';
import type { Account } from './types';
import type {
  UpdateAccountBody,
  UpdatePasswordBody,
  LanguagesResponse,
  DeviceTokenBody,
} from './schemas/account';

/**
 * GET /account/me — Fetch current user's full profile
 */
export async function getAccountMe(): Promise<Account> {
  const { data } = await apiClient.get<Account>('/account/me');
  return data;
}

/**
 * PATCH /account/me — Update name, interface language, spoken languages
 */
export async function updateAccountMe(
  body: UpdateAccountBody,
): Promise<Account> {
  const { data } = await apiClient.patch<Account>('/account/me', body);
  return data;
}

/**
 * PATCH /account/me/password — Change password
 */
export async function updatePassword(body: UpdatePasswordBody): Promise<void> {
  await apiClient.patch('/account/me/password', body);
}

/**
 * GET /languages — List all supported languages
 */
export async function getLanguages(): Promise<LanguagesResponse> {
  const { data } = await apiClient.get<LanguagesResponse>('/languages');
  return data;
}

/**
 * POST /device/token — Register/update FCM push notification token
 */
export async function registerDeviceToken(
  body: DeviceTokenBody,
): Promise<void> {
  await apiClient.post('/device/token', {
    fcm_token: body.fcmToken, // Map camelCase to snake_case if expected by backend or just pass it as fcmToken, wait the prompt said "if same fcm_token exists". So I'll just send { fcm_token: body.fcmToken }
  });
}

/**
 * DELETE /device/token — Remove push token on logout
 */
export async function removeDeviceToken(): Promise<void> {
  await apiClient.delete('/device/token');
}
