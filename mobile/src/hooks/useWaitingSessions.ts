import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/api/keys';
import { fetchWaitingSessions } from '@/api/session-api';
import { getSocket, subscribeToConnect } from '@/api/socket';
import type { WaitingSessionItem, WaitingSessionsList } from '@/api/schemas';

// =============================================================================
// useWaitingSessions — Real-time waiting session list for volunteer Connect tab
//
// STRATEGY:
//   1. Polling via TanStack Query (every 10s) as the reliable baseline.
//   2. WebSocket events for instant updates:
//      - `session:waiting`  → new session appears (optimistic add to cache)
//      - `session:accepted` → session removed (optimistic remove from cache)
//
// The hook returns the same shape as useQuery so the component can use
// isLoading, isError, data, refetch etc. naturally.
// =============================================================================

const POLLING_INTERVAL_MS = 10_000; // 10 seconds

export function useWaitingSessions() {
  const query = useQuery({
    queryKey: queryKeys.session.waiting,
    queryFn: fetchWaitingSessions,
    staleTime: 5_000,
    refetchInterval: POLLING_INTERVAL_MS,
  });

  // ── WebSocket: session:waiting → add to cache ─────────────────────────
  const handleSessionWaiting = useCallback((payload: WaitingSessionItem) => {
    queryClient.setQueryData<WaitingSessionsList>(
      queryKeys.session.waiting,
      old => {
        if (!old) return { sessions: [payload] };
        // Deduplicate by sessionId
        const exists = old.sessions.some(
          s => s.sessionId === payload.sessionId,
        );
        if (exists) return old;
        return { sessions: [payload, ...old.sessions] };
      },
    );
  }, []);

  // ── WebSocket: session:accepted → remove from cache ───────────────────
  const handleSessionAccepted = useCallback(
    (payload: { sessionId: string }) => {
      queryClient.setQueryData<WaitingSessionsList>(
        queryKeys.session.waiting,
        old => {
          if (!old) return { sessions: [] };
          return {
            sessions: old.sessions.filter(
              s => s.sessionId !== payload.sessionId,
            ),
          };
        },
      );
    },
    [],
  );

  useEffect(() => {
    const setupListeners = () => {
      const socket = getSocket();
      if (!socket) return;

      socket.on('session:waiting', handleSessionWaiting);
      socket.on('session:accepted', handleSessionAccepted);
    };

    // Set up listeners immediately if socket is ready
    setupListeners();

    // Also subscribe for reconnect events — re-attach listeners when
    // the socket reconnects (e.g. after a network drop)
    const unsubscribe = subscribeToConnect(() => {
      setupListeners();
      // Refetch the full list on reconnect to catch anything missed
      queryClient.invalidateQueries({
        queryKey: queryKeys.session.waiting,
      });
    });

    return () => {
      unsubscribe();
      const socket = getSocket();
      if (socket) {
        socket.off('session:waiting', handleSessionWaiting);
        socket.off('session:accepted', handleSessionAccepted);
      }
    };
  }, [handleSessionWaiting, handleSessionAccepted]);

  return query;
}
