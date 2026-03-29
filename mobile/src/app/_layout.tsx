import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { useCallback, useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClientProvider } from '@tanstack/react-query';
import { UnistylesRuntime } from 'react-native-unistyles';
import { queryClient } from '@/api/queryClient';
import { useAuth } from '@/store/useAuth';
import { useRole } from '@/store/useRole';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  subscribeToConnect,
} from '@/api/socket';
import { MOCK_USER_ID, MOCK_VOLUNTEER_ID } from '@/constants/mock-ids';

// Side-effect import: registers axios interceptors
import '@/api/client';

const AUTH_BYPASS = process.env.EXPO_PUBLIC_AUTH_BYPASS === 'true';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function Layout() {
  const router = useRouter();
  const isHydrated = useAuth(state => state.isHydrated);
  const hydrate = useAuth(state => state.hydrate);
  const account = useAuth(state => state.account);
  const accessToken = useAuth(state => state.accessToken);
  const userRole = useAuth(state => state.userRole);
  const role = useRole(state => state.role);
  const setRole = useRole(state => state.setRole);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Sync useRole store from auth state when account is available
  // so that theme switching works correctly after login
  useEffect(() => {
    if (userRole && !AUTH_BYPASS) {
      setRole(userRole === 'volunteer' ? 'volunteer' : 'user');
    }
  }, [userRole, setRole]);

  useEffect(() => {
    UnistylesRuntime.setTheme(
      role === 'volunteer' ? 'volunteerLight' : 'userLight',
    );
  }, [role]);

  useEffect(() => {
    if (AUTH_BYPASS) {
      // Dev mode: use mock IDs when no real account exists
      const userId =
        account?.accountId ||
        (role === 'volunteer' ? MOCK_VOLUNTEER_ID : MOCK_USER_ID);
      connectSocket(userId, accessToken ?? undefined);
    } else if (account?.accountId && accessToken) {
      // Production: only connect when authenticated
      connectSocket(account.accountId, accessToken);
    }

    return () => {
      disconnectSocket();
    };
  }, [account?.accountId, accessToken, role]);

  // Volunteers receive session:matched when a seeker is waiting.
  // Attach the handler whenever the socket connects so the volunteer is
  // always ready to navigate — regardless of which tab they're on.
  useEffect(() => {
    const isVolunteer =
      userRole === 'volunteer' || (AUTH_BYPASS && role === 'volunteer');
    if (!isVolunteer) return;

    const onSessionMatched = ({ sessionId }: { sessionId: string }) => {
      router.push(`/volunteer/session/${sessionId}`);
    };

    const attachListener = () => {
      const socket = getSocket();
      if (!socket) return;
      // Remove first to prevent duplicate listeners on reconnect
      socket.off('session:matched', onSessionMatched);
      socket.on('session:matched', onSessionMatched);
    };

    const unsub = subscribeToConnect(attachListener);

    return () => {
      unsub();
      getSocket()?.off('session:matched', onSessionMatched);
    };
  }, [userRole, role, router]);

  const onLayoutRootView = useCallback(async () => {
    if (isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  if (!isHydrated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <KeyboardProvider>
          <Slot />
        </KeyboardProvider>
        <StatusBar />
      </View>
    </QueryClientProvider>
  );
}
