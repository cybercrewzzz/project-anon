import { z } from 'zod';

// ── GET /user/sessions (individual item) ──

export const UserSessionSchema = z.object({
  sessionId: z.uuid(),
  category: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  status: z.string(),
  userRating: z.number().nullable(),
  starredByUser: z.boolean(),
});
export type UserSession = z.infer<typeof UserSessionSchema>;
