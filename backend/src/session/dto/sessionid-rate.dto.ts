import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// DTO for PATCH /session/:sessionId/rate
//
// Two inputs come from the request:
//   1. Path param  — sessionId (validated as UUID, same pattern as accept)
//   2. Request body — rating (1-5) and starred (boolean)
// ─────────────────────────────────────────────────────────────────────────────

// Validates the :sessionId URL parameter
export const RateSessionParamsSchema = z.object({
  sessionId: z.string().uuid({ message: 'sessionId must be a valid UUID' }),
});

// Validates the request body
export const RateSessionBodySchema = z.object({
  // Rating must be a whole number between 1 and 5.
  rating: z
    .number()
    .int()
    .min(1, { message: 'Rating must be at least 1' })
    .max(5, { message: 'Rating cannot exceed 5' }),

  // starred is optional — only seekers can star a session.
  // If a volunteer sends it, the service will ignore it.
  // Defaults to false if not provided.
  starred: z.boolean().optional().default(false),
});

export type RateSessionParamsDto = z.infer<typeof RateSessionParamsSchema>;
export type RateSessionBodyDto   = z.infer<typeof RateSessionBodySchema>;