import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="selectLanguage"
        options={{
          headerShown: false,
          title: '',
          headerTitleAlign: 'center',
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
