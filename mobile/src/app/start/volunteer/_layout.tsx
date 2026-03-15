import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRole } from '@/store/useRole';

const StartLayout = () => {
  const setRole = useRole(state => state.setRole);

  useEffect(() => {
    setRole('volunteer');
  }, [setRole]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="selectLanguage" />
      <Stack.Screen name="authScreens" />
    </Stack>
  );
};

export default StartLayout;
