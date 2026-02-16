import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ backgroundColor: 'bg-default', flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="OTPVerification"
          options={{
            headerShown: false,
            title: '',
            headerTitleAlign: 'center',
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="enterEmail"
          options={{
            headerShown: false,
            title: '',
            headerTitleAlign: 'center',
            headerTransparent: true,
          }}
        />
      </Stack>
    </View>
  );
}
