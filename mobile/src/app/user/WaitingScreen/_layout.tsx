import React from 'react';
import { Stack } from 'expo-router';

const WaitingScreen = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signIn" />
    </Stack>
  );
};

export default WaitingScreen;
