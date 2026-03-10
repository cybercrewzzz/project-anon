import { z } from 'zod';
import { AccountRoleSchema } from './common';

// ── Account (embedded in auth responses) ──

export const AccountSchema = z.object({
  accountId: z.string().uuid(),
  email: z.string().email(),
  nickname: z.string(),
  name: z.string().nullable().optional(),
  roles: z.array(AccountRoleSchema),
});
export type Account = z.infer<typeof AccountSchema>;

// ── POST /auth/register & POST /auth/login ──

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  account: AccountSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ── POST /auth/refresh ──

export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type TokenPair = z.infer<typeof TokenPairSchema>;
