import React from 'react';
import { Stack } from 'expo-router';

const UserLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="P2P-P2V" />
    </Stack>
  );
};

export default UserLayout;
