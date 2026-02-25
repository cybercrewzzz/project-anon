import React from 'react';
import { Stack } from 'expo-router';

const VolunteerLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="getStarted" />
    </Stack>
    
  );
};

export default VolunteerLayout;
