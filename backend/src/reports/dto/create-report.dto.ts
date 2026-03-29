import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// DTO for POST /report
//
// Validates the request body when a user or volunteer submits an abuse report
// for a session. The reporter must be a participant in the session, and the
// reportedId must be the OTHER participant.
//
// Uses Zod (not class-validator) to match the project convention established
// in the session module DTOs.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Must match the ReportCategory enum in the Prisma schema:
 *   harassment | spam | inappropriate_content | impersonation | other
 */
const ReportCategoryEnum = z.enum([
  'harassment',
  'spam',
  'inappropriate_content',
  'impersonation',
  'other',
]);

export const CreateReportSchema = z.object({
  // The session where the abuse occurred.
  sessionId: z.string().uuid({ message: 'sessionId must be a valid UUID' }),

  // The account being reported (the other participant in the session).
  reportedId: z.string().uuid({ message: 'reportedId must be a valid UUID' }),

  // Category of the abuse — must be one of the predefined enum values.
  category: ReportCategoryEnum,

  // Optional free-text description with more detail about what happened.
  description: z
    .string()
    .max(500, { message: 'description cannot exceed 500 characters' })
    .optional(),
});

export type CreateReportDto = z.infer<typeof CreateReportSchema>;
