import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack>
      <Stack.Screen name="[chat]" options={{ headerShown: false }} />
    </Stack>
  );
}
