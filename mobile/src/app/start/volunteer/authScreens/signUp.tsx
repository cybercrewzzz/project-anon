import { View, Pressable, Alert } from 'react-native';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import InputForm from '@/components/inputForm';
import OAuthSignIn from '@/components/oAuthSignIn';
import Button from '@/components/button';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { registerVolunteer } from '@/api/auth';
import { useAuth } from '@/store/useAuth';
import { parseApiError } from '@/api/errors';

const SignUp = () => {
  const router = useRouter();
  const signIn = useAuth(state => state.signIn);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [receiveUpdates, setReceiveUpdates] = useState(false);

  const updateField = (field: keyof typeof form) => (text: string) => {
    setForm(prev => ({ ...prev, [field]: text }));
  };

  const registerMutation = useMutation({
    mutationFn: () =>
      registerVolunteer({
        name: form.name,
        email: form.email,
        password: form.password,
      }),
    onSuccess: async data => {
      try {
        await signIn(data.accessToken, data.refreshToken, data.account);
        router.push('/start/volunteer/authScreens/registerSuccessful' as any);
      } catch (err) {
        console.error('Sign-up onSuccess error:', err);
        Alert.alert(
          'Error',
          'Registration succeeded but sign-in failed. Please log in manually.',
        );
        router.replace('/start/volunteer/authScreens/signIn' as any);
      }
    },
    onError: error => {
      const apiError = parseApiError(error);
      Alert.alert('Registration Failed', apiError.message);
    },
  });

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contentContainer}
      style={styles.screen}
      keyboardShouldPersistTaps="always"
    >
      <View style={styles.header}>
        <AppText variant="largeTitle" emphasis="emphasized">
          Anora App
        </AppText>
        <AppText variant="title1" emphasis="emphasized" color="accent">
          Sign Up
        </AppText>
      </View>

      <View style={styles.form}>
        <InputForm
          placeholder="Name"
          placeholderColor="subtle2"
          onChangeText={updateField('name')}
          value={form.name}
        />
        <InputForm
          placeholder="Email"
          placeholderColor="subtle2"
          onChangeText={updateField('email')}
          value={form.email}
          inputMode="email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <InputForm
          placeholder="Password"
          placeholderColor="subtle2"
          onChangeText={updateField('password')}
          value={form.password}
          secureTextEntry={true}
        />
        <InputForm
          placeholder="Confirm Password"
          placeholderColor="subtle2"
          onChangeText={updateField('confirmPassword')}
          value={form.confirmPassword}
          secureTextEntry={true}
        />
      </View>

      <Pressable
        style={styles.checkboxRow}
        onPress={() => setReceiveUpdates(prev => !prev)}
      >
        <View style={styles.checkbox}>
          {receiveUpdates && <View style={styles.checkboxFill} />}
        </View>
        <AppText variant="caption1" color="muted" style={styles.checkboxText}>
          Yes, I want to receive discounts, loyalty offers and other updates.
        </AppText>
      </Pressable>

      <Button
        text={
          registerMutation.isPending ? 'Creating Account...' : 'Create Account'
        }
        onPress={() => registerMutation.mutate()}
        disabled={registerMutation.isPending}
      />
      <OAuthSignIn />
    </KeyboardAwareScrollView>
  );
};

export default SignUp;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    backgroundColor: theme.background.default,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s6,
    paddingTop: rt.insets.top + theme.spacing.s7,
    paddingBottom: rt.insets.bottom + theme.spacing.s4,
    paddingLeft: rt.insets.left + theme.spacing.s5,
    paddingRight: rt.insets.right + theme.spacing.s5,
  },
  header: {
    gap: theme.spacing.s5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginHorizontal: theme.spacing.s1,
    marginVertical: theme.spacing.s5,
    gap: theme.spacing.s5,
    alignSelf: 'stretch',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s2,
    alignSelf: 'stretch',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: theme.border.default,
    borderRadius: theme.radius.smSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFill: {
    width: 10,
    height: 10,
    backgroundColor: theme.action.secondary,
    borderRadius: theme.radius.xs,
  },
  checkboxText: {
    flex: 1,
  },
}));
