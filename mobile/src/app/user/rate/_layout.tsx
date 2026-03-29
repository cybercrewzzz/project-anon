import { Stack } from 'expo-router';

export default function RateLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
      <Stack.Screen name="rateSession" />
    </Stack>
  );
}
