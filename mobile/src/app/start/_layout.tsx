import React from 'react';
import { Stack } from 'expo-router';

const StartLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="selectLanguage" />
      <Stack.Screen name="authScreens" />
    </Stack>
  );
};

export default StartLayout;
