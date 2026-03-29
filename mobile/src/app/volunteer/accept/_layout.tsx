import { Stack } from 'expo-router';

export default function AcceptSessionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
      <Stack.Screen name="acceptSession" />
    </Stack>
  );
}
