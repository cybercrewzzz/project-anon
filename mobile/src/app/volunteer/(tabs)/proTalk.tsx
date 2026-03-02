import { View, Text, Button } from 'react-native';
import React from 'react';
import { router } from 'expo-router';

const ProTalk = () => {
  return (
    <View>
      <Text>ProTalk</Text>
      <Button
        title="To the OTPVerification"
        onPress={() => router.push('/volunteer/authScreens/OTPVerification')}
      />
      <Button
        title="To Enter Email"
        onPress={() => router.push('/volunteer/authScreens/enterEmail')}
      />
      <Button
        title="To Sign Up and Login"
        onPress={() => router.navigate('/volunteer/signUpNlogin/SignUpNLogin')}
      />
      <Button
        title="To P2P-P2V-withCategory"
        onPress={() =>
          router.navigate(
            '/volunteer/p2p-p2v-withCategory/P2P-P2V-withCategory',
          )
        }
      />
    </View>
  );
};

export default ProTalk;
