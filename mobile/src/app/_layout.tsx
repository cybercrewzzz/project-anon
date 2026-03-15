import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { useCallback, useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { useAuth } from '@/store/useAuth';
import { useRole } from '@/store/useRole';
import { connectSocket, disconnectSocket } from '@/api/socket';

// Side-effect import: registers axios interceptors
import '@/api/client';

// TODO: Remove mock IDs when JWT auth is implemented.
// These are only used as fallbacks when account is null.
// Fixed UUIDs (not random) so the socket and chat screens share the same
// userId; Crypto.randomUUID() here caused divergence with the hardcoded
// fallbacks in the chat screens, breaking sender/outgoing detection.
const MOCK_USER_ID = '8806c4dd-358e-4fb6-a2cd-6f03a3f0ed10'; // seeker2
const MOCK_VOLUNTEER_ID = '29ff5fe9-c7ce-4b26-af56-d4c02da32285'; // volunteer2

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function Layout() {
  const isHydrated = useAuth(state => state.isHydrated);
  const hydrate = useAuth(state => state.hydrate);
  const account = useAuth(state => state.account);
  const accessToken = useAuth(state => state.accessToken);
  const role = useRole(state => state.role);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    // TODO: When auth is implemented, remove the mock fallback
    // and only connect when account?.accountId is available.
    const userId =
      account?.accountId ||
      (role === 'volunteer' ? MOCK_VOLUNTEER_ID : MOCK_USER_ID);

    // Pass the JWT when available so the gateway can authenticate properly.
    // When no token exists the gateway falls back to query.userId (dev only).
    connectSocket(userId, accessToken ?? undefined);

    return () => {
      disconnectSocket();
    };
  }, [account?.accountId, accessToken, role]);

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
