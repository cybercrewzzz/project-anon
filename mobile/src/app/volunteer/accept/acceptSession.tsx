import React from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { acceptSession } from '@/api/session-api';
import { ApiError } from '@/api/errors';

// =============================================================================
// POST /session/:sessionId/accept
//
// This screen is opened when a volunteer taps on a push notification.
// The push notification deep-links here with the sessionId as a param.
//
// Params:
//   sessionId — UUID of the waiting session to accept
//   category  — optional category label shown to the volunteer
// =============================================================================

export default function AcceptSessionScreen() {
  const router = useRouter();
  const { sessionId, category } = useLocalSearchParams<{
    sessionId: string;
    category?: string;
  }>();

  const acceptMutation = useMutation({
    mutationFn: () => acceptSession(sessionId!),
    onSuccess: result => {
      // Navigate into the volunteer chat with this session
      router.replace({
        pathname: '/volunteer/session/[chat]' as never,
        params: { chat: result.sessionId },
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        switch (error.statusCode) {
          case 409:
            // Already accepted by another volunteer, or this volunteer is busy
            Alert.alert(
              'Session Unavailable',
              error.serverError === 'already_in_session'
                ? 'You already have an active session. Please complete it first.'
                : 'Another volunteer has already accepted this session.',
              [{ text: 'OK', onPress: () => router.replace('/volunteer/(tabs)/home' as never) }],
            );
            break;
          case 404:
            Alert.alert(
              'Session Expired',
              'This session is no longer available. It may have expired or been cancelled.',
              [{ text: 'OK', onPress: () => router.replace('/volunteer/(tabs)/home' as never) }],
            );
            break;
          case 403:
            Alert.alert(
              'Cannot Join',
              'You cannot join this session.',
              [{ text: 'OK', onPress: () => router.replace('/volunteer/(tabs)/home' as never) }],
            );
            break;
          default:
            Alert.alert('Error', error.message);
        }
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    },
  });

  const handleAccept = () => {
    if (!sessionId) {
      Alert.alert('Invalid Link', 'Session information is missing.');
      return;
    }
    acceptMutation.mutate();
  };

  const handleDecline = () => {
    router.replace('/volunteer/(tabs)/home' as never);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="headset-outline" size={40} color="#6A00F4" />
        </View>

        <AppText variant="title2" emphasis="emphasized" textAlign="center">
          Someone Needs Help
        </AppText>

        <AppText variant="body" textAlign="center" color="accent">
          A person is seeking support right now. Your time and compassion can
          make a real difference.
        </AppText>

        {/* Category badge */}
        {category && (
          <View style={styles.categoryBadge}>
            <Ionicons name="pricetag-outline" size={14} color="#6A00F4" />
            <AppText variant="caption1" emphasis="emphasized" color="accent">
              {category}
            </AppText>
          </View>
        )}

        {/* Info note */}
        <View style={styles.infoRow}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#9E9E9E"
          />
          <AppText variant="caption2" color="accent" style={styles.infoText}>
            The session is anonymous and confidential. Only one volunteer can
            accept — be quick!
          </AppText>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.declineButton}
            onPress={handleDecline}
            disabled={acceptMutation.isPending}
          >
            <AppText variant="body" color="accent">
              Decline
            </AppText>
          </Pressable>

          <Pressable
            style={[
              styles.acceptButton,
              acceptMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleAccept}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <AppText
                  variant="body"
                  emphasis="emphasized"
                  color="secondary"
                >
                  Accept Session
                </AppText>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s5,
  },
  card: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.s6,
    width: '100%',
    gap: theme.spacing.s4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6A00F415',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.s2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6A00F412',
    paddingHorizontal: theme.spacing.s4,
    paddingVertical: theme.spacing.s2,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: '#6A00F425',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.surface.muted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s3,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
    width: '100%',
    marginTop: theme.spacing.s2,
  },
  declineButton: {
    flex: 1,
    paddingVertical: theme.spacing.s3,
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.text.subtle2,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: theme.spacing.s3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s2,
    borderRadius: theme.radius.md,
    backgroundColor: '#6A00F4',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
}));
