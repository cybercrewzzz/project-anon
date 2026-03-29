import React, { useState } from 'react';
import { View, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from './AppText';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReportCategory =
  | 'harassment'
  | 'inappropriate'
  | 'spam'
  | 'other';

interface ReportBottomSheetProps {
  /** Controls visibility of the bottom sheet */
  visible: boolean;
  /** Called when the user dismisses (cancel / overlay tap) */
  onClose: () => void;
  /** Called when the user submits the report */
  onSubmit: (data: { category: ReportCategory; description: string }) => void;
  /** When true, disables submit button and shows loading state */
  isPending?: boolean;
}

// ── Category options ──────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: ReportCategory; label: string }[] = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A bottom-sheet-style modal for submitting abuse reports.
 *
 * Slides up from the bottom with a dark overlay.
 * Contains a category selector and free-text description input.
 *
 * @example
 * <ReportBottomSheet
 *   visible={showReport}
 *   onClose={() => setShowReport(false)}
 *   onSubmit={handleReportSubmit}
 *   isPending={mutation.isPending}
 * />
 */
export default function ReportBottomSheet({
  visible,
  onClose,
  onSubmit,
  isPending = false,
}: ReportBottomSheetProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');

  const canSubmit =
    selectedCategory !== null && description.trim().length > 0 && !isPending;

  const handleSubmit = () => {
    if (!canSubmit || !selectedCategory) return;
    onSubmit({ category: selectedCategory, description: description.trim() });
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/* Overlay */}
      <Pressable style={styles.overlay} onPress={handleClose} />

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title */}
          <AppText
            variant="title3"
            emphasis="emphasized"
            textAlign="center"
          >
            Report User
          </AppText>

          {/* Subtitle */}
          <AppText
            variant="footnote"
            color="gray"
            textAlign="center"
            style={styles.subtitle}
          >
            Help us keep the community safe. Select a reason and describe what
            happened.
          </AppText>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Category selector */}
          <AppText
            variant="subhead"
            emphasis="emphasized"
            style={styles.sectionLabel}
          >
            Reason for reporting
          </AppText>

          <View style={styles.categoryContainer}>
            {CATEGORY_OPTIONS.map(option => {
              const isSelected = selectedCategory === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillSelected,
                  ]}
                  onPress={() => setSelectedCategory(option.value)}
                >
                  <AppText
                    variant="footnote"
                    emphasis="emphasized"
                    color={isSelected ? 'secondary' : 'primary'}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* Description input */}
          <AppText
            variant="subhead"
            emphasis="emphasized"
            style={styles.sectionLabel}
          >
            Description
          </AppText>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholder="Describe what happened..."
              placeholderTextColor="#B8B8B8"
              textAlignVertical="top"
            />
          </View>

          {/* Submit button */}
          <Pressable
            style={[
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <AppText variant="body" emphasis="emphasized" color="secondary">
              {isPending ? 'Submitting...' : 'Submit Report'}
            </AppText>
          </Pressable>

          {/* Cancel link */}
          <Pressable onPress={handleClose} style={styles.cancelButton}>
            <AppText variant="body" color="gray">
              Cancel
            </AppText>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create(theme => ({
  overlay: {
    flex: 1,
    backgroundColor: theme.background.overlay,
  },
  sheet: {
    backgroundColor: theme.background.default,
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s7,
    paddingHorizontal: theme.spacing.s5,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  handle: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.text.muted,
    alignSelf: 'center',
    marginBottom: theme.spacing.s4,
  },
  scrollContent: {
    gap: theme.spacing.s2,
    paddingBottom: theme.spacing.s4,
  },
  subtitle: {
    marginTop: theme.spacing.s2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.border.default,
    marginVertical: theme.spacing.s3,
  },
  sectionLabel: {
    marginTop: theme.spacing.s2,
    marginBottom: theme.spacing.s3,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s3,
  },
  categoryPill: {
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.surface.muted,
  },
  categoryPillSelected: {
    backgroundColor: theme.action.secondary,
  },
  textInputContainer: {
    borderRadius: theme.radius.sm,
    backgroundColor: theme.surface.muted,
    minHeight: 100,
    padding: theme.spacing.s4,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 20,
    color: theme.text.primary,
    minHeight: 80,
  },
  submitButton: {
    paddingVertical: theme.spacing.s3 + theme.spacing.s2,
    paddingHorizontal: theme.spacing.s5,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.action.secondary,
    borderRadius: theme.radius.full,
    marginTop: theme.spacing.s4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.s3,
  },
}));
