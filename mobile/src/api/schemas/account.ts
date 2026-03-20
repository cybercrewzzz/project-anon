import { z } from 'zod';
import { AccountSchema } from './auth';

// ── GET /account/me ──
// Response is just the Account schema
export type AccountMeResponse = z.infer<typeof AccountSchema>;

// ── PATCH /account/me ──
export const UpdateAccountBodySchema = z.object({
  name: z.string().optional(),
  interfaceLanguage: z.string().optional(),
  spokenLanguages: z.array(z.string()).optional(),
});
export type UpdateAccountBody = z.infer<typeof UpdateAccountBodySchema>;

// ── PATCH /account/me/password ──
export const UpdatePasswordBodySchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
});
export type UpdatePasswordBody = z.infer<typeof UpdatePasswordBodySchema>;

// ── GET /languages ──
export const LanguageSchema = z.object({
  code: z.string(),
  name: z.string(),
  nativeName: z.string().optional(),
});
export type Language = z.infer<typeof LanguageSchema>;
export type LanguagesResponse = z.infer<typeof LanguageSchema>[];

// ── POST /device/token ──
export const DeviceTokenBodySchema = z.object({
  fcmToken: z.string(),
});
export type DeviceTokenBody = z.infer<typeof DeviceTokenBodySchema>;
