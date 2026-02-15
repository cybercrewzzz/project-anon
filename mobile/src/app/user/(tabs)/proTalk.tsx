import { View, Text, Button } from 'react-native';
import React from 'react';
import { router } from 'expo-router';

const ProTalk = () => {
  return (
    <View>
      <Text>ProTalk</Text>
      <Button
        title="TnS Agreee"
        onPress={() => router.push('/user/TnS agree/TnS')}
      />
    </View>
  );
};

export default ProTalk;
