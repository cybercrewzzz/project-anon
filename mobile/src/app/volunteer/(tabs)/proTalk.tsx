import { View, Text, Button } from 'react-native';
import React from 'react';
import { router } from 'expo-router';

const ProTalk = () => {
  return (
    <View>
      <Text>ProTalk</Text>
      <Button title="To the p2p-And screen" onPress={() => router.push('/volunteer/authScreens/OTPVerification')} />
    </View>
  );
};


export default ProTalk;