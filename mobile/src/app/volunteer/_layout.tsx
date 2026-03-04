import { Stack } from 'expo-router';

const VolunteerLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="getStarted" />
      <Stack.Screen
        name="P2p-And/p2p-and"
        options={{
          headerShown: true,
          headerTitleAlign: 'center',
          title: 'Volunteer Connect',
        }}
      />
    </Stack>
  );
};

export default VolunteerLayout;
