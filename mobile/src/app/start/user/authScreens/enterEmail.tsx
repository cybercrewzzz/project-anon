import React, { useState } from 'react';
import { AppText } from '@/components/AppText';
import { View, Alert } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { FullWidthButton } from '@/components/FullWidthButton';
import InputForm from '@/components/inputForm';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '@/api/auth';
import { parseApiError } from '@/api/errors';

const EnterEmail = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: (emailToSend: string) => forgotPassword(emailToSend),
    onSuccess: (_, emailToSend) => {
      router.push({
        pathname: '/start/user/authScreens/OTPVerification',
        params: { email: emailToSend },
      } as any);
    },
    onError: error => {
      Alert.alert('Error', parseApiError(error).message);
    },
  });

  const handleContinue = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }
    mutate(trimmedEmail);
  };

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
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isPending}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <FullWidthButton onPress={handleContinue} disabled={isPending}>
          <AppText variant="headline" color="secondary">
            {isPending ? 'Sending...' : 'Continue'}
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
