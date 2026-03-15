import React, { useState } from 'react';
import { AppText } from '@/components/AppText';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { FullWidthButton } from '@/components/FullWidthButton';
import InputForm from '@/components/inputForm';
import { useRouter } from 'expo-router';

const EnterEmail = () => {
  const [email, setEmail] = useState('');
  const { theme } = useUnistyles();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View>
          <AppText
            variant="title1"
            emphasis="emphasized"
            color="primary"
            style={styles.title}
          >
            Reset Your Password
          </AppText>
          <AppText
            variant="subhead"
            textAlign="left"
            style={styles.description}
          >
            Please enter your email address below and we will send an OTP code
            to reset your password.
          </AppText>
        </View>

        <View style={styles.inputSection}>
          <InputForm
            placeholder="Email"
            placeholderColor="subtle2"
            formColor={theme.surface.primary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <FullWidthButton onPress={() => router.push('/start/volunteer/authScreens/OTPVerification' as any)}>
          <AppText variant="headline" color="secondary">
            Continue
          </AppText>
        </FullWidthButton>
      </View>
    </View>
  );
};

export default EnterEmail;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.surface.primary,
    paddingTop: rt.insets.top + theme.spacing.s6,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + theme.spacing.s4,
    paddingRight: rt.insets.right + theme.spacing.s4,
  },
  contentContainer: {
    justifyContent: 'flex-start',
    paddingTop: rt.insets.top + theme.spacing.s6,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: theme.spacing.s8,
  },
  title: {
    textAlign: 'left',
    paddingLeft: theme.spacing.s2,
  },
  description: {
    marginTop: theme.spacing.s5,
    marginLeft: theme.spacing.s2,
    paddingLeft: theme.spacing.s2,
  },
  inputSection: {
    paddingTop: theme.spacing.s7,
  },
}));
