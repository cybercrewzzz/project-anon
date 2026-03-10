import { z } from 'zod';
import { AccountRoleSchema, LanguageSchema } from './common';

// ── GET /user/profile & PATCH /user/profile ──

export const UserProfileSchema = z.object({
  accountId: z.uuid(),
  email: z.email(),
  nickname: z.string(),
  dateOfBirth: z.string(),
  gender: z.string(),
  interfaceLanguageId: z.uuid().nullable(),
  languages: z.array(LanguageSchema),
  roles: z.array(AccountRoleSchema),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ── GET /user/sessions (individual item) ──

export const UserSessionSchema = z.object({
  sessionId: z.uuid(),
  category: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  status: z.string(),
  userRating: z.number().nullable(),
  starredByUser: z.boolean(),
});
export type UserSession = z.infer<typeof UserSessionSchema>;
