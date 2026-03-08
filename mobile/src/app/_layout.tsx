import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { useCallback, useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { useAuth } from '@/store/useAuth';

// Side-effect import: registers axios interceptors
import '@/api/client';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function Layout() {
  const isHydrated = useAuth(state => state.isHydrated);
  const hydrate = useAuth(state => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
