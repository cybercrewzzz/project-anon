import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ backgroundColor: 'bg-default', flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="P2P-P2V-withCategory"
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
