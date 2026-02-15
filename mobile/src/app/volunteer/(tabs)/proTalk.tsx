import { View, Text, Button } from 'react-native';
import React from 'react';
import { router } from 'expo-router';

const ProTalk = () => {
  return (
    <View>
      <Text>ProTalk</Text>
      <Button
        title="To Enter Email"
        onPress={() => router.push('/volunteer/authScreens/enterEmail')}
      />
    </View>
  );
};

export default ProTalk;
