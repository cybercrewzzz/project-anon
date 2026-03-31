import { useRole } from '@/store/useRole';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useCallback } from 'react';
import { getSocket, subscribeToConnect } from '@/api/socket';

const VolunteerLayout = () => {
  const setRole = useRole(state => state.setRole);
  const router = useRouter();

  useEffect(() => {
    setRole('volunteer');
  }, [setRole]);

  // ── Global session:matched listener ──────────────────────────────
  // When the backend matches this volunteer via Path A (instant match),
  // the server emits `session:matched` to the volunteer's socket.
  // Navigate directly to the chat screen so the volunteer doesn't have
  // to manually discover the session.
  const handleSessionMatched = useCallback(
    (payload: { sessionId: string }) => {
      if (!payload?.sessionId) return;
      router.push({
        pathname: '/volunteer/session/[chat]' as never,
        params: { chat: payload.sessionId },
      });
    },
    [router],
  );

  useEffect(() => {
    const attachListener = () => {
      const socket = getSocket();
      if (!socket) return;
      socket.on('session:matched', handleSessionMatched);
    };

    // Attach immediately if the socket is already connected
    attachListener();

    // Re-attach when socket reconnects
    const unsub = subscribeToConnect(attachListener);

    return () => {
      unsub();
      const socket = getSocket();
      if (socket) {
        socket.off('session:matched', handleSessionMatched);
      }
    };
  }, [handleSessionMatched]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="getStarted" />
      <Stack.Screen name="session" />
      <Stack.Screen name="EditProfile" />
      <Stack.Screen
        name="accept"
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
    </Stack>
  );
};

export default VolunteerLayout;

