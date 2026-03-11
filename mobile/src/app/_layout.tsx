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
const MOCK_USER_ID = 'f3430b6a-7fde-4777-868b-fb6fffb813ac';
const MOCK_VOLUNTEER_ID = '3e4ece8c-6115-4cae-87b8-20561283973f';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function Layout() {
  const isHydrated = useAuth(state => state.isHydrated);
  const hydrate = useAuth(state => state.hydrate);
  const account = useAuth(state => state.account);
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

    connectSocket(userId);

    return () => {
      disconnectSocket();
    };
  }, [account?.accountId, role]);

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
