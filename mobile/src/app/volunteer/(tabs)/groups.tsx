import { View } from 'react-native';
import React from 'react';
import Button from '@/components/button';
import { useRouter } from 'expo-router';

const Groups = () => {
  const router = useRouter();
  return (
    <View>
      <Button
        text="Verify"
        onPress={() => router.navigate('/volunteer/getStarted/verify')}
      />
      <Button
        text="Sign Up"
        onPress={() => router.navigate('/volunteer/getStarted/signUp')}
      />
      <Button
        text="Select Language"
        onPress={() => router.navigate('/volunteer/getStarted/selectLanguage')}
      />
    </View>
  );
};

export default Groups;
