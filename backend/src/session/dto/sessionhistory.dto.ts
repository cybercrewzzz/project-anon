import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// DTO for GET /session/history
//
// This endpoint has NO request body (it's a GET request).
// The only inputs are QUERY PARAMETERS in the URL:
//   GET /session/history?page=1&limit=20
//
// Query params always arrive as strings (e.g. "1", "20") even if they look
// like numbers. Zod's .coerce.number() handles the string → number conversion
// automatically, so we don't have to do parseInt() ourselves.
// ─────────────────────────────────────────────────────────────────────────────

export const SessionHistoryQuerySchema = z.object({
  // Which page of results to return. Defaults to 1 if not provided.
  // .coerce converts the string "1" from the URL into the number 1.
  page: z.coerce
    .number()
    .int()
    .min(1, { message: 'page must be at least 1' })
    .default(1),

  // How many results per page. Defaults to 20, capped at 100.
  // Capping prevents someone from requesting 10,000 rows in one call.
  limit: z.coerce
    .number()
    .int()
    .min(1, { message: 'limit must be at least 1' })
    .max(100, { message: 'limit cannot exceed 100' })
    .default(20),
});

export type SessionHistoryQueryDto = z.infer<typeof SessionHistoryQuerySchema>;
