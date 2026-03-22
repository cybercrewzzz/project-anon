import { View, Pressable, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import InputForm from '@/components/inputForm';
import { FullWidthButton } from '@/components/FullWidthButton';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useApplyAsVolunteer } from '@/hooks/useVolunteerProfile';
import { useAuth } from '@/store/useAuth';
import { parseApiError } from '@/api/errors';
import { useSpecialisations } from '@/hooks/useLookup';
import { common } from '@/theme/palettes/common';

// ─── TODO: Replace with a real upload flow when image upload is implemented ───
const PLACEHOLDER_IMAGE_URL = 'https://placeholder.com/institute-id.jpg';

const Verify = () => {
  const router = useRouter();
  const accountName = useAuth(state => state.account?.name ?? '');

  const [form, setForm] = useState({
    name: '',
    instituteEmail: '',
    grade: '',
    instituteName: '',
    instituteId: '', // maps to studentId in the API
    aboutYou: '', // maps to about in the API (optional)
  });
  const [confirmed, setConfirmed] = useState(false);
  const [isPermanentlyDisabled, setIsPermanentlyDisabled] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const [selectedSpecialisationIds, setSelectedSpecialisationIds] = useState<
    string[]
  >([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const {
    data: specialisations,
    isLoading: isLoadingSpecs,
    isError: isErrorSpecs,
    refetch: refetchSpecs,
  } = useSpecialisations();

  const toggleSpecialisation = (id: string) => {
    setSelectedSpecialisationIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const { mutate: apply, isPending } = useApplyAsVolunteer();

  // ── Pre-fill name from auth store ───────────────────────────────────────────
  useEffect(() => {
    if (accountName) {
      setForm(prev => ({ ...prev, name: accountName }));
    }
  }, [accountName]);

  const updateField = (field: keyof typeof form) => (text: string) => {
    setForm(prev => ({ ...prev, [field]: text }));
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isInstituteEmailValid = emailRegex.test(form.instituteEmail.trim());

  const isFormValid =
    confirmed &&
    form.name.trim().length > 0 &&
    isInstituteEmailValid &&
    form.grade.trim().length > 0 &&
    form.instituteName.trim().length > 0 &&
    form.instituteId.trim().length > 0 &&
    selectedSpecialisationIds.length > 0;

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    setHasAttemptedSubmit(true);
    if (!isFormValid) return;

    apply(
      {
        name: form.name.trim(),
        instituteEmail: form.instituteEmail.trim(),
        instituteName: form.instituteName.trim(),
        studentId: form.instituteId.trim(),
        grade: form.grade.trim(),
        about: form.aboutYou.trim() || undefined,
        specialisationIds: selectedSpecialisationIds,
        instituteIdImageUrl: PLACEHOLDER_IMAGE_URL,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Application Submitted',
            'Your verification is pending admin review.',
          );
          router.replace(
            '/start/volunteer/authScreens/VerificationSubmitSuccessful' as any,
          );
        },
        onError: (err: any) => {
          const apiError = parseApiError(err);

          if (apiError.statusCode === 409) {
            setConflictError('You have already submitted an application.');
            setIsPermanentlyDisabled(true);
            return;
          }

          if (apiError.statusCode === 400) {
            Alert.alert(
              'Submission Failed',
              'Please check your inputs and try again.',
            );
            return;
          }

          Alert.alert(
            'Submission Failed',
            apiError.message || 'Something went wrong. Please try again.',
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

      {/* ── Error message ── */}
      {conflictError && (
        <AppText
          variant="caption1"
          textAlign="center"
          style={styles.errorMessage}
        >
          {conflictError}
        </AppText>
      )}

      <View style={styles.form}>
        {/* Name is pre-filled from the sign-up screen and cannot be edited */}
        <InputForm
          placeholder="Name"
          placeholderColor="subtle2"
          onChangeText={updateField('name')}
          value={form.name}
          placeholderVariant="subhead"
          editable={false}
          style={{ opacity: 0.6 }}
        />
        <InputForm
          placeholder="Institute Email"
          placeholderColor="subtle2"
          onChangeText={updateField('instituteEmail')}
          value={form.instituteEmail}
          inputMode="email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderVariant="subhead"
          editable={!isPending && !isPermanentlyDisabled}
        />
        <InputForm
          placeholder="Grade"
          placeholderColor="subtle2"
          onChangeText={updateField('grade')}
          value={form.grade}
          placeholderVariant="subhead"
          editable={!isPending && !isPermanentlyDisabled}
        />
        <InputForm
          placeholder="Institute Name"
          placeholderColor="subtle2"
          onChangeText={updateField('instituteName')}
          value={form.instituteName}
          placeholderVariant="subhead"
          editable={!isPending && !isPermanentlyDisabled}
        />

        <View style={styles.instituteIdWrapper}>
          <InputForm
            placeholder="Institute ID"
            placeholderColor="subtle2"
            onChangeText={updateField('instituteId')}
            value={form.instituteId}
            contentContainerStyle={styles.instituteIdInput}
            placeholderVariant="subhead"
            editable={!isPending && !isPermanentlyDisabled}
          />
          {/* TODO: wire this up to expo-image-picker when ready */}
          <Pressable style={styles.attachmentIcon}>
            <AppText variant="title3" color="accent">
              {'\u{1F4CE}'}
            </AppText>
          </Pressable>
        </View>

        {/* ── SPECIALISATIONS SECTION ── */}
        <View style={styles.specialisationSection}>
          <AppText
            variant="caption1"
            emphasis="emphasized"
            color="subtle2"
            style={styles.specialisationLabel}
          >
            Select your specialisations
          </AppText>

          {isLoadingSpecs ?
            <ActivityIndicator size="small" />
          : isErrorSpecs ?
            <View style={{ alignItems: 'flex-start', paddingVertical: 8 }}>
              <AppText variant="body" emphasis="emphasized" color="subtle2">
                Could not load specialisations. Tap to retry.
              </AppText>
              <Pressable
                onPress={() => refetchSpecs()}
                style={{ paddingVertical: 8 }}
              >
                <AppText variant="body" emphasis="emphasized" color="accent">
                  Retry
                </AppText>
              </Pressable>
            </View>
          : <View style={styles.tagRow}>
              {(specialisations ?? []).map(spec => {
                const selected = selectedSpecialisationIds.includes(
                  spec.specialisationId,
                );
                return (
                  <Pressable
                    key={spec.specialisationId}
                    style={[styles.tagPill, selected && styles.tagPillSelected]}
                    onPress={() => toggleSpecialisation(spec.specialisationId)}
                  >
                    <AppText
                      variant="caption1"
                      emphasis="emphasized"
                      style={
                        selected ?
                          styles.tagTextSelected
                        : styles.tagTextDefault
                      }
                    >
                      {spec.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          }

          {hasAttemptedSubmit && selectedSpecialisationIds.length === 0 && (
            <AppText variant="caption1" style={styles.errorMessage}>
              Select at least one specialisation
            </AppText>
          )}
        </View>

        <InputForm
          placeholder="About You :"
          placeholderColor="subtle2"
          onChangeText={updateField('aboutYou')}
          value={form.aboutYou}
          multiline
          numberOfLines={4}
          contentContainerStyle={styles.aboutYouInput}
          style={styles.aboutYouTextInput}
          placeholderVariant="subhead"
          editable={!isPending && !isPermanentlyDisabled}
        />
      </View>

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
        {/* Button is disabled until form is valid, not loading, and specialisations finished loading */}
        <FullWidthButton
          onPress={handleSubmit}
          disabled={
            !isFormValid || isPending || isPermanentlyDisabled || isLoadingSpecs
          }
          style={{
            opacity:
              (
                !isFormValid ||
                isPending ||
                isPermanentlyDisabled ||
                isLoadingSpecs
              ) ?
                0.5
              : 1,
          }}
        >
          <AppText variant="headline" color="secondary" emphasis="emphasized">
            {isPending ? 'Submitting...' : 'Verify Me'}
          </AppText>
        </FullWidthButton>
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
    color: theme.state.error,
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
  buttonWrapper: {
    marginTop: theme.spacing.s7,
  },
  specialisationSection: {
    gap: theme.spacing.s2,
  },
  specialisationLabel: {
    marginLeft: theme.spacing.s2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: theme.spacing.s4,
    columnGap: theme.spacing.s3,
    marginTop: theme.spacing.s1,
  },
  tagPill: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.surface.primary,
    borderWidth: 1,
    borderColor: common.gray[300],
    paddingVertical: theme.spacing.s1,
    paddingHorizontal: theme.spacing.s3,
    minHeight: 30,
    justifyContent: 'center',
  },
  tagPillSelected: {
    backgroundColor: '#0E7FBC',
    borderColor: '#0E7FBC',
  },
  tagTextDefault: {
    color: theme.text.accent,
  },
  tagTextSelected: {
    color: common.white,
  },
}));
