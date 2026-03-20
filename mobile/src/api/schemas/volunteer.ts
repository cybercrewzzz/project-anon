import { z } from 'zod';

// ── GET /volunteer/profile & PATCH /volunteer/profile ──

export const VolunteerProfileSchema = z.object({
  accountId: z.uuid(),
  name: z.string(),
  instituteEmail: z.email().nullable(),
  instituteName: z.string().nullable(),
  grade: z.string().nullable(),
  tagline: z.string().nullable(),
  about: z.string().nullable(),
  verificationStatus: z.string(),
  isAvailable: z.boolean(),
  specialisations: z.array(
    z.object({
      specialisationId: z.uuid(),
      name: z.string(),
    }),
  ),
  experience: z.object({
    points: z.number(),
    level: z.number(),
  }),
});
export type VolunteerProfile = z.infer<typeof VolunteerProfileSchema>;

// ── POST /volunteer/apply ──

export const VolunteerApplyResponseSchema = z.object({
  message: z.string(),
  verificationStatus: z.string(),
});
export type VolunteerApplyResponse = z.infer<
  typeof VolunteerApplyResponseSchema
>;

// ── PATCH /volunteer/status ──

export const VolunteerStatusResponseSchema = z.object({
  isAvailable: z.boolean(),
});
export type VolunteerStatusResponse = z.infer<
  typeof VolunteerStatusResponseSchema
>;
