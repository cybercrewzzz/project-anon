import { View, Pressable } from 'react-native';
import React, { useState } from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import { SmallButton } from '@/components/SmallButton';
import InputForm from '@/components/inputForm';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { FullWidthButton } from '@/components/FullWidthButton';
import { useRouter } from 'expo-router';

const AGE_RANGES = ['16 -20', '21 -26', '27+'] as const;

const SignUp = () => {
  const router = useRouter();
  const { theme } = useUnistyles();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedAge, setSelectedAge] = useState<string>('21 -26');
  const [receiveUpdates, setReceiveUpdates] = useState(false);

  const updateField = (field: keyof typeof form) => (text: string) => {
    setForm(prev => ({ ...prev, [field]: text }));
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contentContainer}
      style={styles.screen}
      keyboardShouldPersistTaps="always"
    >
      <View style={styles.header}>
        <AppText variant="largeTitle" emphasis="emphasized">
          Project Anon
        </AppText>
        <AppText variant="title1" emphasis="emphasized" color="accent">
          Sign Up
        </AppText>
      </View>

      <View style={styles.form}>
        <InputForm
          placeholder="Email"
          placeholderColor="subtle2"
          formColor={theme.surface.primary}
          onChangeText={updateField('email')}
          value={form.email}
          inputMode="email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.ageSection}>
          <AppText variant="callout" emphasis="emphasized" color="accent">
            Age
          </AppText>
          <View style={styles.ageOptions}>
            {AGE_RANGES.map(range => (
              <SmallButton
                key={range}
                selected={selectedAge === range}
                onPress={() => setSelectedAge(range)}
                onPressIn={() => setSelectedAge(range)}
              >
                {range}
              </SmallButton>
            ))}
          </View>
        </View>
        <InputForm
          placeholder="Password"
          placeholderColor="subtle2"
          formColor={theme.surface.primary}
          onChangeText={updateField('password')}
          value={form.password}
          secureTextEntry={true}
        />
        <InputForm
          placeholder="Confirm Password"
          placeholderColor="subtle2"
          formColor={theme.surface.primary}
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

      <View style={styles.buttonContainer}>
        <FullWidthButton
          onPress={() =>
            router.replace('/user/start/authScreens/registerSuccessful' as any)
          }
        >
          <AppText variant="headline" color="secondary">
            Sign Up
          </AppText>
        </FullWidthButton>
        <Pressable
          onPress={() => router.push('/user/start/authScreens/signIn' as any)}
          style={styles.loginLink}
        >
          <AppText variant="body" color="primary">
            Already have an account?{' '}
            <AppText variant="body" emphasis="emphasized" color="accent">
              Log in
            </AppText>
          </AppText>
        </Pressable>
      </View>
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
  ageSection: {
    gap: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s3,
  },
  ageOptions: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
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
    borderColor: theme.text.muted,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFill: {
    width: 10,
    height: 10,
    backgroundColor: theme.action.secondary,
    borderRadius: 2,
  },
  checkboxText: {
    flex: 1,
  },
  buttonContainer: {
    alignSelf: 'stretch',
    marginTop: theme.spacing.s6,
  },
  loginLink: {
    marginTop: theme.spacing.s5,
    alignItems: 'center',
  },
}));
