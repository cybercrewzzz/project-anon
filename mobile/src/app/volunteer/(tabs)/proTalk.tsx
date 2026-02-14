import { View, Text, Button } from 'react-native';
import React from 'react';
import { router } from 'expo-router';

const ProTalk = () => {
  return (
    <View>
      <Text>ProTalk</Text>
      <Button title="P2P-P2V" onPress={() => router.push('/StartedScreen/welcome')} />
    </View>
  );
};

export default ProTalk;
