import { useRole } from '@/store/useRole';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

const VolunteerLayout = () => {
  const setRole = useRole(state => state.setRole);

  useEffect(() => {
    setRole('volunteer');
  }, [setRole]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="getStarted" />
      <Stack.Screen name="session" />
      <Stack.Screen name="EditProfile" />
      {/* <Stack.Screen name="verificationPending" /> */}
    </Stack>
  );
};

export default VolunteerLayout;
