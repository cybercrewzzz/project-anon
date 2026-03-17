import { View, Pressable, Alert } from 'react-native';
import React, { useState } from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import AuthHeader from '@/components/authHeader';
import InputForm from '@/components/inputForm';
import OAuthSignIn from '@/components/oAuthSignIn';
import Button from '@/components/button';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/auth';
import { useAuth } from '@/store/useAuth';
import { parseApiError } from '@/api/errors';

const SignIn = () => {
  const router = useRouter();
  const { theme } = useUnistyles();
  const signIn = useAuth(state => state.signIn);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const loginMutation = useMutation({
    mutationFn: () => login(credentials.email, credentials.password),
    onSuccess: async data => {
      await signIn(data.accessToken, data.refreshToken, data.account);
      router.replace('/start/volunteer/authScreens/loginSuccessful' as any);
    },
    onError: error => {
      const apiError = parseApiError(error);
      Alert.alert('Login Failed', apiError.message);
    },
  });

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contentContainer}
      style={styles.screen}
      keyboardShouldPersistTaps="always"
    >
      <AuthHeader titleColor="accent" />
      <View style={styles.form}>
        <InputForm
          placeholder="Email"
          placeholderColor="subtle2"
          formColor={theme.surface.primary}
          onChangeText={text =>
            setCredentials(prev => ({ ...prev, email: text }))
          }
          value={credentials.email}
          inputMode="email"
        />
        <InputForm
          placeholder="Password"
          placeholderColor="subtle2"
          formColor={theme.surface.primary}
          onChangeText={text =>
            setCredentials(prev => ({ ...prev, password: text }))
          }
          value={credentials.password}
          secureTextEntry={true}
        />
        <Pressable
          onPress={() =>
            router.push('/start/volunteer/authScreens/enterEmail' as any)
          }
        >
          <AppText variant="footnote" color="accent">
            Forgot your password?
          </AppText>
        </Pressable>
      </View>
      <Button
        text={loginMutation.isPending ? 'Signing In...' : 'Sign In'}
        onPress={() => loginMutation.mutate()}
        disabled={loginMutation.isPending}
      />
      <OAuthSignIn />
      <Pressable
        onPress={() =>
          router.push('/start/volunteer/authScreens/signUp' as any)
        }
        style={styles.signUp}
      >
        <AppText variant="callout" color="subtle1">
          Need An Account?{' '}
        </AppText>
        <AppText variant="callout" emphasis="emphasized" color="subtle1">
          Sign Up
        </AppText>
      </Pressable>
    </KeyboardAwareScrollView>
  );
};

export default SignIn;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    backgroundColor: theme.background.default,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s6,
    paddingTop: rt.insets.top + theme.spacing.s7,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + theme.spacing.s4,
    paddingRight: rt.insets.right + theme.spacing.s4,
  },
  form: {
    marginHorizontal: theme.spacing.s6,
    marginVertical: theme.spacing.s5,
    gap: theme.spacing.s5,
    alignSelf: 'stretch',
  },
  signUp: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
}));
