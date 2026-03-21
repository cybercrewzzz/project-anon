import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRole } from '@/store/useRole';

const UserLayout = () => {
  const setRole = useRole(state => state.setRole);

  useEffect(() => {
    setRole('user');
  }, [setRole]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="WaitingScreen"
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <Stack.Screen name="session" />
    </Stack>
  );
};

export default UserLayout;
