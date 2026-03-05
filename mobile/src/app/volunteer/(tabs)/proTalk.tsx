import { View, Text, Button } from 'react-native';
import React from 'react';
import { router } from 'expo-router';

const ProTalk = () => {
  return (
    <View>
      <Text>ProTalk</Text>
      <Button
        title="P2P-P2V"
        onPress={() => router.push('/volunteer/StartedScreen/welcome')}
      />
      <Button
        title="To the OTPVerification"
        onPress={() => router.push('/volunteer/authScreens/OTPVerification')}
      />
      <Button
        title="To Enter Email"
        onPress={() => router.push('/volunteer/authScreens/enterEmail')}
      />
      <Button
        title="To Login Successful"
        onPress={() =>
          router.push('/volunteer/loginSuccessful/LoginSuccessful')
        }
      />
      <Button
        title="To Sign Up and Login"
        onPress={() => router.navigate('/volunteer/signUpNlogin/SignUpNLogin')}
      />
    </View>
  );
};

export default ProTalk;
