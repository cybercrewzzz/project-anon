import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';
import { useVolunteerProfile } from '@/hooks/useVolunteerProfile';
import { useVolunteerEditProfile } from '@/hooks/useVolunteerEditProfile';
import { FullWidthButton } from '@/components/FullWidthButton';
import { useRouter } from 'expo-router';
import { common } from '@/theme/palettes/common';

const EditVolunteerProfile = () => {
  const router = useRouter();
  const { data: profile, isLoading: isLoadingProfile } = useVolunteerProfile();

  const {
    about,
    setAbout,
    selectedIds,
    toggleSpecialisation,
    specialisations,
    isLoadingSpecialisations,
    handleSave,
    isSaving,
    isDirty,
  } = useVolunteerEditProfile(
    profile?.about ?? null,
    profile?.specialisations?.map(s => s.specialisationId) ?? [],
  );

  const [saveError, setSaveError] = useState<string | null>(null);

  const isLoading = isLoadingProfile || isLoadingSpecialisations;

  const handleSavePress = () => {
    setSaveError(null);
    handleSave({
      onSuccess: () => {
        router.back();
      },
      onError: () => {
        setSaveError('Could not save changes. Please try again.');
      },
    });
  };

  const handleCancelPress = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const ABOUT_MAX = 500;
  const selectedCount = selectedIds.length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* About You Section */}
        <View style={styles.section}>
          <AppText
            style={styles.sectionLabel}
            variant="body"
            emphasis="emphasized"
            color="accent"
          >
            About you
          </AppText>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={about}
              editable={!isSaving}
              onChangeText={text => {
                setSaveError(null);
                if (text.length <= ABOUT_MAX) {
                  setAbout(text);
                }
              }}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#7dd3fc"
              multiline
              numberOfLines={4}
            />
            <AppText
              style={styles.charCount}
              variant="caption1"
              color="subtle2"
            >
              {about.length}/{ABOUT_MAX}
            </AppText>
          </View>
        </View>

        {/* Specialisations Section */}
        <View style={styles.section}>
          <AppText
            style={styles.sectionLabel}
            variant="body"
            emphasis="emphasized"
            color="accent"
          >
            Your specialisations
          </AppText>
          <AppText style={styles.sectionHint} variant="caption1" color="muted">
            Tap to select or deselect
          </AppText>
          <View style={styles.chipsContainer}>
            {specialisations?.map(spec => {
              const isSelected = selectedIds.includes(spec.specialisationId);
              return (
                <Pressable
                  key={spec.specialisationId}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  disabled={isSaving}
                  onPress={() => {
                    setSaveError(null);
                    toggleSpecialisation(spec.specialisationId);
                  }}
                >
                  <AppText
                    variant="callout"
                    emphasis="emphasized"
                    style={
                      isSelected ?
                        styles.chipTextSelected
                      : styles.chipTextDefault
                    }
                  >
                    {spec.name}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.selectedCountContainer}>
            <AppText variant="body" color="subtle2">
              {selectedCount} specialisation{selectedCount !== 1 ? 's' : ''}{' '}
              selected
            </AppText>
          </View>
        </View>

        {/* Save Changes Button */}
        {saveError !== null && (
          <AppText variant="footnote" style={styles.saveError}>
            {saveError}
          </AppText>
        )}
        <FullWidthButton
          onPress={handleSavePress}
          disabled={isSaving || !isDirty}
        >
          <AppText variant="body" emphasis="emphasized" color="secondary">
            {isSaving ? 'Saving...' : 'Save changes'}
          </AppText>
        </FullWidthButton>

        {/* Cancel Button */}
        <FullWidthButton
          onPress={handleCancelPress}
          disabled={isSaving}
          style={styles.cancelButton}
        >
          <AppText variant="body" emphasis="emphasized" color="primary">
            Cancel
          </AppText>
        </FullWidthButton>

        {/* Footer Text */}
        <AppText style={styles.footerText} variant="caption1" color="subtle2">
          Your information is safe and confidential.
        </AppText>
      </ScrollView>
    </View>
  );
};

export default EditVolunteerProfile;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.surface.muted,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface.secondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: theme.spacing.s4,
    paddingBottom: rt.insets.bottom + theme.spacing.s6,
    paddingLeft: rt.insets.left + theme.spacing.s4,
    paddingRight: rt.insets.right + theme.spacing.s4,
    gap: theme.spacing.s4,
  },
  section: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s4,
    boxShadow: theme.elevation.level2,
  },
  sectionLabel: {
    marginBottom: theme.spacing.s2,
  },
  sectionHint: {
    marginBottom: theme.spacing.s3,
  },
  inputContainer: {
    backgroundColor: theme.surface.secondary,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.s3,
    position: 'relative',
  },
  input: {
    fontSize: 15,
    color: theme.text.primary,
    minHeight: 40,
    paddingRight: theme.spacing.s6,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    position: 'absolute',
    right: theme.spacing.s3,
    bottom: theme.spacing.s3,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s2,
  },
  chip: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.surface.primary,
    borderWidth: 1,
    borderColor: theme.text.gray,
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    minHeight: 32,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: theme.action.secondary,
    borderColor: theme.action.secondary,
  },
  chipTextDefault: {
    color: theme.text.accent,
  },
  chipTextSelected: {
    color: theme.text.secondary,
  },
  selectedCountContainer: {
    backgroundColor: theme.surface.secondary,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.s3,
    marginTop: theme.spacing.s3,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.surface.primary,
    borderColor: common.gray[300],
    borderWidth: 1,
    alignItems: 'center',
    marginTop: theme.spacing.s2,
    paddingVertical: theme.spacing.s3 + theme.spacing.s2,
    paddingHorizontal: theme.spacing.s5,
    borderRadius: theme.radius.full,
  },
  footerText: {
    textAlign: 'center',
    marginTop: theme.spacing.s2,
  },
  saveError: {
    color: theme.state.error,
    textAlign: 'center',
    marginBottom: theme.spacing.s2,
  },
}));
