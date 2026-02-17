import React from 'react';
import { Stack } from 'expo-router';

const GetStartedLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="verify" />
    </Stack>
  );
};

export default GetStartedLayout;
