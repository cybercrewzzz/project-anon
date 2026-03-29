/**
 * Query key factory — single source of truth for all TanStack Query cache keys.
 *
 * Usage:
 *   queryKey: queryKeys.user.profile()
 *   queryClient.invalidateQueries({ queryKey: queryKeys.user.all })
 */
export const queryKeys = {
  // ── User (seeker) ──
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    sessions: (params?: { page?: number; limit?: number }) =>
      [...queryKeys.user.all, 'sessions', params] as const,
  },

  // ── Volunteer ──
  volunteer: {
    all: ['volunteer'] as const,
    profile: () => [...queryKeys.volunteer.all, 'profile'] as const,
    sessions: (params?: { page?: number; limit?: number }) =>
      [...queryKeys.volunteer.all, 'sessions', params] as const,
  },

  // ── Session ──
  session: {
    all: ['session'] as const,
    detail: (sessionId: string) =>
      [...queryKeys.session.all, sessionId] as const,
  },

  // ── Reference data ──
  categories: ['categories'] as const,
  languages: ['languages'] as const,
  specialisations: ['specialisations'] as const,

  // ── Tickets ──
  tickets: ['tickets', 'remaining'] as const,

  // ── Block list ──
  blocks: ['blocks'] as const,

  // ── Reports ──
  reports: ['reports'] as const,
} as const;
