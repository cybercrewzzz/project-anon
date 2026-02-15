import React from 'react';
import { Stack } from 'expo-router';

const UserAuthLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signIn" />
    </Stack>
  );
};

export default UserAuthLayout;
