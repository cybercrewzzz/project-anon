import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import { FullWidthButton } from '@/components/FullWidthButton';
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
  fieldGroup: {
    gap: theme.spacing.s3,
  },
  label: {
    marginLeft: theme.spacing.s1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.s4,
    paddingVertical: theme.spacing.s3,
    gap: theme.spacing.s3,
    boxShadow: theme.elevation.level3,
  },
  textInput: {
    flex: 1,
    color: theme.text.primary,
    padding: 0,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: theme.spacing.s8,
  },
}));

const CreateNewPassword = () => {
  const router = useRouter();
  const { theme } = useUnistyles();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
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
        <View style={styles.fieldGroup}>
          <AppText
            variant="subhead"
            emphasis="emphasized"
            color="primary"
            style={styles.label}
          >
            New Password
          </AppText>
          <View style={styles.inputRow}>
            {/* <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.text.muted}
            /> */}
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <Pressable onPress={() => setShowNewPassword(v => !v)} hitSlop={8}>
              <Ionicons
                name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.text.muted}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <AppText
            variant="subhead"
            emphasis="emphasized"
            color="primary"
            style={styles.label}
          >
            Confirm New Password
          </AppText>
          <View style={styles.inputRow}>
            {/* <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.text.muted}
            /> */}
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <Pressable
              onPress={() => setShowConfirmPassword(v => !v)}
              hitSlop={8}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.text.muted}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <FullWidthButton>
          <AppText variant="headline" color="secondary">
            Continue
          </AppText>
        </FullWidthButton>
      </View>
    </View>
  );
};

export default CreateNewPassword;
