import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// DTO for POST /session/:sessionId/accept
//
// This endpoint has NO request body — the only input is the sessionId in the
// URL path parameter, and the volunteer's identity comes from their JWT token.
//
// So why does this file exist?
// We still define a Zod schema for the PATH PARAMETER (sessionId) to validate
// that it's a proper UUID before the service even runs. If someone calls
// POST /session/not-a-uuid/accept, we reject it with 400 immediately.
// ─────────────────────────────────────────────────────────────────────────────

export const AcceptSessionParamsSchema = z.object({
  sessionId: z.string().uuid({ message: 'sessionId must be a valid UUID' }),
});

export type AcceptSessionParamsDto = z.infer<typeof AcceptSessionParamsSchema>;
