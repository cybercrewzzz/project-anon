import { z } from 'zod';
import { AccountRoleSchema, LanguageSchema } from './common';

export const AgeRangeSchema = z.enum([
  'range_16_20',
  'range_21_26',
  'range_27_plus',
]);
export type AgeRange = z.infer<typeof AgeRangeSchema>;

export const AccountProfileSchema = z.object({
  accountId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  nickname: z.string(),
  ageRange: AgeRangeSchema,
  gender: z.string(),
  status: z.string(),
  createdAt: z.string(),
  interfaceLanguage: LanguageSchema.nullable(),
  languages: z.array(LanguageSchema),
  roles: z.array(AccountRoleSchema),
});
export type AccountProfile = z.infer<typeof AccountProfileSchema>;

export const UpdateAccountDtoSchema = z.object({
  name: z.string().optional(),
  interfaceLanguageId: z.string().uuid().optional(),
  languageIds: z.array(z.string().uuid()).optional(),
});
export type UpdateAccountDto = z.infer<typeof UpdateAccountDtoSchema>;

export const ChangePasswordDtoSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
});
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;

export const RegisterDeviceTokenDtoSchema = z.object({
  fcmToken: z.string(),
  platform: z.enum(['ios', 'android', 'web']),
});
export type RegisterDeviceTokenDto = z.infer<
  typeof RegisterDeviceTokenDtoSchema
>;
