import { Stack } from 'expo-router';

export default function SessionHistoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sessionHistory" />
    </Stack>
  );
}
