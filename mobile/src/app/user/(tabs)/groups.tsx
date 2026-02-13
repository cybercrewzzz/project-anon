import { View, Button } from 'react-native';
import React from 'react';
import { router } from 'expo-router';

const Groups = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Get Started"
        onPress={() => router.navigate('/user/StartedScreens/selectLanguage')}
      />
    </View>
  );
};

export default Groups;
