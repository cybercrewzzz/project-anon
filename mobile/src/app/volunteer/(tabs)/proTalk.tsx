import { View } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import Button from '@/components/button';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';

const ProTalk = () => {
  return (
    <View style={styles.container}>
      <AppText variant="title1" emphasis="emphasized" color="accent">
        ProTalk
      </AppText>
      <View style={styles.buttonsContainer}>
        <Button
          text="To the OTPVerification"
          onPress={() => router.push('/volunteer/authScreens/OTPVerification')}
        />
        <Button
          text="To Enter Email"
          onPress={() => router.push('/volunteer/authScreens/enterEmail')}
        />
        <Button
          text="To Login Successful"
          onPress={() =>
            router.push('/volunteer/loginSuccessful/LoginSuccessful')
          }
        />
        <Button
          text="To Sign Up and Login"
          onPress={() => router.push('/volunteer/signUpNlogin/SignUpNLogin')}
        />
        <Button
          text="Open Peer to Peer"
          onPress={() => router.push('/volunteer/PeertoPeer/peertopeer')}
        />
        <Button
          title="SignUpNLogin"
          onPress={() =>
            router.navigate('/volunteer/SignupNLoginV/signupNlogin')
          }
        />
      </View>
    </View>
  );
};

export default ProTalk;

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s7,
    paddingHorizontal: theme.spacing.s5,
  },
  buttonsContainer: {
    alignSelf: 'stretch',
    gap: theme.spacing.s4,
  },
}));
