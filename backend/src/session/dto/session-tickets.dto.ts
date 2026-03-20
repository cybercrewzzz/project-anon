import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// DTO for GET /session/tickets
//
// This endpoint has NO body and NO query parameters.
// The only input is the caller's identity from their JWT token.
//
// This file exists purely for consistency — every endpoint has a DTO file
// even if there's nothing to validate. It also makes it easy to add
// query params later (e.g. ?date=2026-03-06) without restructuring.
// ─────────────────────────────────────────────────────────────────────────────

// Empty schema — no inputs needed beyond the JWT identity.
export const TicketsQuerySchema = z.object({});
export type TicketsQueryDto = z.infer<typeof TicketsQuerySchema>;
