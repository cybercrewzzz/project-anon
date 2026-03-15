import { Stack } from 'expo-router';

const VolunteerLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="getStarted" />
      <Stack.Screen name="session" />
    </Stack>
  );
};

export default VolunteerLayout;
