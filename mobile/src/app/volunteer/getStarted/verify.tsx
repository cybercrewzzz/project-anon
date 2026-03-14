import { View, Pressable, Alert } from 'react-native';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import InputForm from '@/components/inputForm';
import { FullWidthButton } from '@/components/FullWidthButton';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useApplyAsVolunteer } from '@/hooks/useVolunteerProfile';

// ─── TODO: Replace this with a real specialisation UUID from your DB ──────────
// Once you have a specialisations endpoint, fetch these dynamically.
const PLACEHOLDER_SPECIALISATION_ID = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

// ─── TODO: Replace with a real upload flow when image upload is implemented ───
const PLACEHOLDER_IMAGE_URL = 'https://placeholder.com/institute-id.jpg';

const Verify = () => {
  const [form, setForm] = useState({
    name: '',
    instituteEmail: '',
    grade: '',
    instituteName: '',
    instituteId: '',   // maps to studentId in the API
    aboutYou: '',      // maps to about in the API (optional)
  });
  const [confirmed, setConfirmed] = useState(false);

  const { mutate: apply, isPending, error } = useApplyAsVolunteer();

  const updateField = (field: keyof typeof form) => (text: string) => {
    setForm(prev => ({ ...prev, [field]: text }));
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const isFormValid =
    confirmed &&
    form.name.trim().length > 0 &&
    form.instituteEmail.trim().length > 0 &&
    form.grade.trim().length > 0 &&
    form.instituteName.trim().length > 0 &&
    form.instituteId.trim().length > 0;

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!isFormValid) return;

    apply(
      {
        name: form.name.trim(),
        instituteEmail: form.instituteEmail.trim(),
        instituteName: form.instituteName.trim(),
        studentId: form.instituteId.trim(),
        grade: form.grade.trim(),
        about: form.aboutYou.trim() || undefined,
        // TODO: replace both placeholders below once implemented
        instituteIdImageUrl: PLACEHOLDER_IMAGE_URL,
        specialisationIds: [PLACEHOLDER_SPECIALISATION_ID],
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Application Submitted',
            'Your verification is pending admin review.',
          );
        },
        onError: (err: any) => {
          Alert.alert(
            'Submission Failed',
            err?.message ?? 'Something went wrong. Please try again.',
          );
        },
      },
    );
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contentContainer}
      style={styles.screen}
      keyboardShouldPersistTaps="always"
    >
      <AppText
        variant="title1"
        color="accent"
        textAlign="center"
        emphasis="emphasized"
      >
        Verification
      </AppText>

      <View style={styles.form}>
        <InputForm
          placeholder="Name"
          placeholderColor="subtle2"
          formColor="#FDFAFF"
          onChangeText={updateField('name')}
          value={form.name}
          placeholderVariant="subhead"
        />
        <InputForm
          placeholder="Institute Email"
          placeholderColor="subtle2"
          formColor="#FDFAFF"
          onChangeText={updateField('instituteEmail')}
          value={form.instituteEmail}
          inputMode="email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderVariant="subhead"
        />
        <InputForm
          placeholder="Grade"
          placeholderColor="subtle2"
          formColor="#FDFAFF"
          onChangeText={updateField('grade')}
          value={form.grade}
          placeholderVariant="subhead"
        />
        <InputForm
          placeholder="Institute Name"
          placeholderColor="subtle2"
          formColor="#FDFAFF"
          onChangeText={updateField('instituteName')}
          value={form.instituteName}
          placeholderVariant="subhead"
        />

        <View style={styles.instituteIdWrapper}>
          <InputForm
            placeholder="Institute ID"
            placeholderColor="subtle2"
            formColor="#FDFAFF"
            onChangeText={updateField('instituteId')}
            value={form.instituteId}
            contentContainerStyle={styles.instituteIdInput}
            placeholderVariant="subhead"
          />
          {/* TODO: wire this up to expo-image-picker when ready */}
          <Pressable style={styles.attachmentIcon}>
            <AppText variant="title3" color="accent">
              {'\u{1F4CE}'}
            </AppText>
          </Pressable>
        </View>

        <InputForm
          placeholder="About You :"
          placeholderColor="subtle2"
          formColor="#FDFAFF"
          onChangeText={updateField('aboutYou')}
          value={form.aboutYou}
          multiline
          numberOfLines={4}
          contentContainerStyle={styles.aboutYouInput}
          style={styles.aboutYouTextInput}
          placeholderVariant="subhead"
        />
      </View>

      {/* ── Error message ── */}
      {error && (
        <AppText variant="caption1" textAlign="center" style={styles.errorMessage}>
          {(error as any)?.message ?? 'Submission failed. Please try again.'}
        </AppText>
      )}

      <Pressable
        style={styles.checkboxRow}
        onPress={() => setConfirmed(prev => !prev)}
      >
        <View style={styles.checkbox}>
          {confirmed && <View style={styles.checkboxFill} />}
        </View>
        <AppText variant="caption1" color="muted" style={styles.checkboxText}>
          Yes, I confirm that the above information is true.
        </AppText>
      </Pressable>

      <View style={styles.buttonWrapper}>
        {/* Button is disabled until form is valid and not loading */}
        <Pressable
          onPress={handleSubmit}
          disabled={!isFormValid || isPending}
          style={{ opacity: !isFormValid || isPending ? 0.5 : 1 }}
        >
          <FullWidthButton>
            <AppText variant="headline" color="secondary" emphasis="emphasized">
              {isPending ? 'Submitting...' : 'Verify Me'}
            </AppText>
          </FullWidthButton>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default Verify;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    backgroundColor: theme.background.default,
  },
  contentContainer: {
    gap: theme.spacing.s5,
    paddingTop: rt.insets.top + theme.spacing.s7,
    paddingBottom: rt.insets.bottom + theme.spacing.s4,
    paddingLeft: rt.insets.left + theme.spacing.s5,
    paddingRight: rt.insets.right + theme.spacing.s5,
  },
  form: {
    gap: theme.spacing.s4,
    alignSelf: 'stretch',
  },
  instituteIdWrapper: {
    position: 'relative',
  },
  instituteIdInput: {
    paddingRight: theme.spacing.s7,
  },
  attachmentIcon: {
    position: 'absolute',
    right: theme.spacing.s3,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  aboutYouInput: {
    minHeight: 100,
  },
  aboutYouTextInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  errorMessage: {
    color: theme.state.error
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s2,
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
  buttonWrapper: {
    marginTop: theme.spacing.s7,
  },
}));
