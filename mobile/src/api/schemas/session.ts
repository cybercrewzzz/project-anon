import { z } from 'zod';

// ── POST /session/connect (match found) ──

export const SessionConnectMatchSchema = z.object({
  sessionId: z.uuid(),
  volunteerId: z.uuid(),
  wsRoom: z.string(),
  turnCredentials: z.object({
    urls: z.array(z.string()),
    username: z.string(),
    credential: z.string(),
  }),
});
export type SessionConnectMatch = z.infer<typeof SessionConnectMatchSchema>;

// ── POST /session/connect (waiting) ──

export const SessionConnectWaitingSchema = z.object({
  status: z.literal('waiting'),
  sessionId: z.uuid(),
});
export type SessionConnectWaiting = z.infer<typeof SessionConnectWaitingSchema>;

// ── POST /session/:id/accept ──

export const SessionAcceptSchema = z.object({
  sessionId: z.uuid(),
  seekerId: z.uuid(),
  category: z.string(),
  wsRoom: z.string(),
  turnCredentials: z.object({
    urls: z.array(z.string()),
    username: z.string(),
    credential: z.string(),
  }),
});
export type SessionAccept = z.infer<typeof SessionAcceptSchema>;

// ── GET /session/:id ──

export const SessionDetailSchema = z.object({
  sessionId: z.uuid(),
  category: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  status: z.string(),
  closedReason: z.string().nullable(),
  userRating: z.number().nullable(),
  volunteerRating: z.number().nullable(),
  starredByUser: z.boolean(),
});
export type SessionDetail = z.infer<typeof SessionDetailSchema>;
