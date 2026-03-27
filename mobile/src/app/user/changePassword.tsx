import React, { useState } from 'react';
import { Pressable, View, Alert, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import { FullWidthButton } from '@/components/FullWidthButton';
import InputForm from '@/components/inputForm';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { changePassword } from '@/api/account';
import { parseApiError } from '@/api/errors';

const ChangePassword = () => {
  const { theme } = useUnistyles();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('All fields are required.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match.');
      }
      return changePassword({ currentPassword, newPassword });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: error => {
      // The thrown matching error vs API error
      const msg = error instanceof Error && (error.message.includes('match') || error.message.includes('required'))
        ? error.message 
        : parseApiError(error).message;
      Alert.alert('Update Failed', msg);
    },
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} style={styles.backIcon} />
      </Pressable>

      <View style={styles.header}>
        <AppText variant="title1" emphasis="emphasized" color="primary">
          Change Password 🔒
        </AppText>
        <AppText variant="subhead" color="primary" style={styles.description}>
          Please enter your current password and create a new one.
        </AppText>
      </View>

      <View style={styles.form}>
        <InputForm
          placeholder="Current Password"
          placeholderColor="subtle2"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={true}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
        />

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
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={theme.text.secondary} />
          ) : (
            <AppText variant="headline" color="secondary">
              Update Password
            </AppText>
          )}
        </FullWidthButton>
      </View>
    </View>
  );
};

export default ChangePassword;

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
