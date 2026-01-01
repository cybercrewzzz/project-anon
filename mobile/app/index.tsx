import { Text, View } from 'react-native';

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
          fontWeight: '600',
          fontStyle: 'italic',
        }}
      >
        Edit app/index.tsx to edit this screen.
      </Text>
    </View>
  );
}
