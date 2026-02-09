import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';
import { typography } from '@/theme/tokens/typography';
//import { useRouter } from 'expo-router';

const OTPInput = () => {
  return (
    <TextInput
      style={styles.otpInput}
      maxLength={1}
      keyboardType="number-pad"
    />
  );
};

const OTPVerification = () => {
  //const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <AppText variant="title1" color="primary" style={styles.title}>
          OTP Code Verification 🔒
        </AppText>

        <AppText variant="body" style={styles.description}>
          We have sent a OTP code to your email exa***@gmail.com. Enter the OTP
          code below to verify.
        </AppText>
      </View>

      <View style={styles.otpContainer}>
        <OTPInput />
        <OTPInput />
        <OTPInput />
        <OTPInput />
      </View>

      <View>
        <AppText variant="body" style={styles.verifyText}>
          Did not receive the email?
        </AppText>
        <AppText variant="body" style={styles.verifyText}>
          Resend OTP
        </AppText>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          //onPress={() => router.navigate('')}
        >
          <AppText variant="headline" color="secondary">
            {' '}
            Create new Password{' '}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
};

export default OTPVerification;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.surface.primary,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
  },
  contentContainer: {
    justifyContent: 'flex-start',
    paddingTop: rt.insets.top + 30,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 64,
  },
  title: {
    textAlign: 'left',
    paddingLeft: 5,
    fontSize: typography.title1.emphasized.fontSize,
    fontWeight: typography.title1.emphasized.fontWeight,
  },
  description: {
    textAlign: 'left',
    marginTop: 20,
    marginLeft: 5,
    paddingLeft: 5,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: rt.insets.top,
  },
  otpInput: {
    width: 80,
    height: 64,
    borderWidth: 2,
    borderColor: theme.border.default,
    backgroundColor: theme.surface.secondary,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
  },
  verifyText: {
    marginTop: 25,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 15,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: theme.action.secondary,
  },
}));
