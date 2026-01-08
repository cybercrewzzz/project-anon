import { Text } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: 'Poppins',
          fontWeight: 400,
        }}
      >
        Edit app/index.tsx to edit this screen.
      </Text>
    </View>
  );
}
