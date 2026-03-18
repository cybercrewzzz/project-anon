import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import { FullWidthButton } from '@/components/FullWidthButton';
import InputForm from '@/components/inputForm';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.surface.primary,
    paddingTop: rt.insets.top + theme.spacing.s5,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + theme.spacing.s4,
    paddingRight: rt.insets.right + theme.spacing.s4,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: theme.spacing.s2,
    marginBottom: theme.spacing.s5,
  },
  header: {
    gap: theme.spacing.s4,
    marginBottom: theme.spacing.s7,
  },
  description: {
    lineHeight: 22,
  },
  form: {
    gap: theme.spacing.s6,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: theme.spacing.s8,
  },
  backIcon: {
    color: theme.text.primary,
  },
}));

const CreateNewPassword = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} style={styles.backIcon} />
      </Pressable>

      <View style={styles.header}>
        <AppText variant="title1" emphasis="emphasized" color="primary">
          Create new password 🔒
        </AppText>
        <AppText variant="subhead" color="primary" style={styles.description}>
          You are almost there! Please create a new password for your account.
        </AppText>
      </View>

      <View style={styles.form}>
        <InputForm
          placeholder="New Password"
          placeholderColor="subtle2"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={true}
          autoCapitalize="none"
          autoComplete="new-password"
        />

        <InputForm
          placeholder="Confirm New Password"
          placeholderColor="subtle2"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={true}
          autoCapitalize="none"
          autoComplete="new-password"
        />
      </View>

      <View style={styles.buttonContainer}>
        <FullWidthButton
          onPress={() =>
            router.push('/start/volunteer/authScreens/ResetPassword' as any)
          }
        >
          <AppText variant="headline" color="secondary">
            Continue
          </AppText>
        </FullWidthButton>
      </View>
    </View>
  );
};

export default CreateNewPassword;
