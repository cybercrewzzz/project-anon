import React from 'react';
import { Stack } from 'expo-router';

const VolunteerLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false, headerTitleAlign: 'center'}}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="p2p-and" 
        options={{ 
          headerShown: true,
          title: 'Volunteer Connect'
        }} 
      />
    </Stack>
  );
};

export default VolunteerLayout;
