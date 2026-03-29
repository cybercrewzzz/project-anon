import React from 'react';
import { View, Pressable, Modal } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from './AppText';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlockConfirmationDialogProps {
  /** Controls visibility of the dialog */
  visible: boolean;
  /** Called when the user dismisses (cancel / overlay tap) */
  onClose: () => void;
  /** Called when the user confirms the block action */
  onConfirm: () => void;
  /** When true, disables buttons and shows loading state */
  isPending?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A bottom-sheet-style confirmation dialog for blocking a user.
 *
 * Slides up from the bottom with a dark overlay.
 * Shows a warning message and two action buttons (Block / Cancel).
 *
 * @example
 * <BlockConfirmationDialog
 *   visible={showBlockDialog}
 *   onClose={() => setShowBlockDialog(false)}
 *   onConfirm={handleBlockConfirm}
 *   isPending={blockMutation.isPending}
 * />
 */
export default function BlockConfirmationDialog({
  visible,
  onClose,
  onConfirm,
  isPending = false,
}: BlockConfirmationDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={isPending ? undefined : onClose}
    >
      {/* Overlay */}
      <Pressable
        style={styles.overlay}
        onPress={isPending ? undefined : onClose}
        accessible={false}
      />

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Warning icon */}
        <View style={styles.warningIconContainer}>
          <AppText style={styles.warningEmoji}>⚠️</AppText>
        </View>

        {/* Title */}
        <AppText
          variant="title3"
          emphasis="emphasized"
          textAlign="center"
        >
          Block this user?
        </AppText>

        {/* Description */}
        <AppText
          variant="body"
          color="gray"
          textAlign="center"
          style={styles.description}
        >
          They won&apos;t be able to match with you in future sessions. You can
          unblock them anytime from Settings.
        </AppText>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Button row */}
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.cancelButton, isPending && styles.buttonDisabled]}
            onPress={onClose}
            disabled={isPending}
          >
            <AppText variant="body" emphasis="emphasized" color="secondary">
              Cancel
            </AppText>
          </Pressable>

          <Pressable
            style={[
              styles.blockButton,
              isPending && styles.buttonDisabled,
            ]}
            onPress={onConfirm}
            disabled={isPending}
          >
            <AppText variant="body" emphasis="emphasized" color="secondary">
              {isPending ? 'Blocking...' : 'Block'}
            </AppText>
          </Pressable>
        </View>
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
    borderTopLeftRadius: theme.radius.xlSoft,
    borderTopRightRadius: theme.radius.xlSoft,
    alignItems: 'center',
    gap: theme.spacing.s4,
  },
  handle: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.text.muted,
    marginBottom: theme.spacing.s3,
  },
  warningIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.surface.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningEmoji: {
    fontSize: 28,
  },
  description: {
    paddingHorizontal: theme.spacing.s4,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.border.default,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.s5,
    marginTop: theme.spacing.s3,
  },
  cancelButton: {
    backgroundColor: theme.action.secondary,
    paddingVertical: theme.spacing.s3 + theme.spacing.s1,
    paddingHorizontal: theme.spacing.s7,
    borderRadius: theme.radius.full,
  },
  blockButton: {
    backgroundColor: theme.state.error,
    paddingVertical: theme.spacing.s3 + theme.spacing.s1,
    paddingHorizontal: theme.spacing.s7,
    borderRadius: theme.radius.full,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
}));
