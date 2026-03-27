import React, { useState } from 'react';
import {
  View,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rateSession } from '@/api/session-api';
import { ApiError } from '@/api/errors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// =============================================================================
// PATCH /session/:sessionId/rate
//
// This screen is navigated to after a session ends, for both seekers and volunteers.
// Params:
//   sessionId  — UUID of the session to rate
//   isSeeker   — 'true' if the caller is a seeker (shows starred toggle)
// =============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StarButton({
  index,
  selected,
  onPress,
}: {
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.3, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <AnimatedPressable style={animStyle} onPress={handlePress}>
      <Ionicons
        name={selected ? 'star' : 'star-outline'}
        size={44}
        color={selected ? '#FFC107' : '#D1C4E9'}
      />
    </AnimatedPressable>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function RateSessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sessionId, isSeeker } = useLocalSearchParams<{
    sessionId: string;
    isSeeker?: string;
  }>();

  const showStarred = isSeeker === 'true';

  const [rating, setRating] = useState<number>(0);
  const [starred, setStarred] = useState(false);

  const rateMutation = useMutation({
    mutationFn: () =>
      rateSession(sessionId!, {
        rating,
        starred: showStarred ? starred : undefined,
      }),
    onSuccess: () => {
      // Invalidate history so it shows the updated rating
      queryClient.invalidateQueries({ queryKey: ['session', 'history'] });
      // Navigate away — go home or back
      router.replace(
        showStarred ? '/user/(tabs)/home' : ('/volunteer/(tabs)/home' as never),
      );
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.statusCode === 409) {
          Alert.alert(
            'Already Rated',
            'You have already submitted a rating for this session.',
          );
          router.replace(
            showStarred ? '/user/(tabs)/home' : (
              ('/volunteer/(tabs)/home' as never)
            ),
          );
        } else if (error.statusCode === 400) {
          Alert.alert(
            'Session Not Completed',
            'You can only rate a session after it has ended.',
          );
        } else {
          Alert.alert('Rating Failed', error.message);
        }
      } else {
        Alert.alert('Error', 'Could not submit rating. Please try again.');
      }
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rate the Session', 'Please select a star rating first.');
      return;
    }
    rateMutation.mutate();
  };

  const handleSkip = () => {
    router.replace(
      showStarred ? '/user/(tabs)/home' : ('/volunteer/(tabs)/home' as never),
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Decorative top bar */}
        <View style={styles.topBar} />

        <AppText variant="title2" emphasis="emphasized" textAlign="center">
          Rate Your Session
        </AppText>
        <AppText variant="body" textAlign="center" color="accent">
          How was your experience with{' '}
          {showStarred ? 'the volunteer' : 'the seeker'}?
        </AppText>

        {/* Star rating */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <StarButton
              key={i}
              index={i}
              selected={i <= rating}
              onPress={() => setRating(i)}
            />
          ))}
        </View>

        {rating > 0 && (
          <AppText
            variant="subhead"
            emphasis="emphasized"
            textAlign="center"
            color="accent"
          >
            {RATING_LABELS[rating]}
          </AppText>
        )}

        {/* Starred toggle — seekers only */}
        {showStarred && (
          <View style={styles.starredRow}>
            <View style={styles.starredLabel}>
              <Ionicons name="bookmark-outline" size={18} color="#6A00F4" />
              <AppText variant="body">Save this session</AppText>
            </View>
            <Switch
              value={starred}
              onValueChange={setStarred}
              thumbColor={starred ? '#6A00F4' : '#E0E0E0'}
              trackColor={{ false: '#E0E0E0', true: '#C5B9F2' }}
            />
          </View>
        )}

        <View style={styles.buttonRow}>
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <AppText variant="body" color="accent">
              Skip
            </AppText>
          </Pressable>

          <Pressable
            style={[
              styles.submitButton,
              rating === 0 && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={rating === 0 || rateMutation.isPending}
          >
            {rateMutation.isPending ?
              <ActivityIndicator color="#fff" size="small" />
            : <AppText variant="body" emphasis="emphasized" color="secondary">
                Submit Rating
              </AppText>
            }
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s5,
  },
  card: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.s6,
    width: '100%',
    gap: theme.spacing.s5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  topBar: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.text.subtle2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
  },
  starredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: theme.spacing.s2,
    backgroundColor: theme.surface.muted,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.s3,
  },
  starredLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
    width: '100%',
  },
  skipButton: {
    flex: 1,
    paddingVertical: theme.spacing.s3,
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.text.subtle2,
  },
  submitButton: {
    flex: 2,
    paddingVertical: theme.spacing.s3,
    alignItems: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: '#6A00F4',
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
}));
