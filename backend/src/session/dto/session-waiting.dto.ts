import { z } from 'zod';

// ── GET /session/waiting ──
// Response schema for the list of waiting sessions available to volunteers.

export const WaitingSessionItemSchema = z.object({
  sessionId: z.string().uuid(),
  category: z.string().nullable(),
  seekerNickname: z.string(),
  startedAt: z.string(),
});

export type WaitingSessionItem = z.infer<typeof WaitingSessionItemSchema>;

export const WaitingSessionsResponseSchema = z.object({
  sessions: z.array(WaitingSessionItemSchema),
});

export type WaitingSessionsResponse = z.infer<
  typeof WaitingSessionsResponseSchema
>;
