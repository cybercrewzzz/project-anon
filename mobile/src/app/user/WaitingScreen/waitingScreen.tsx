import { AppText } from '@/components/AppText';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getSocket, requestSession, subscribeToConnect } from '@/api/socket';

type MatchStatus = 'searching' | 'no_volunteer' | 'error';

export default function WaitingScreen() {
  const router = useRouter();
  const { problemId } = useLocalSearchParams<{ problemId?: string }>();

  const [matchStatus, setMatchStatus] = useState<MatchStatus>('searching');
  // Bumped on each socket connect event so the request effect re-runs.
  const [trigger, setTrigger] = useState(0);

  const scale = useSharedValue(1);

  // Pulsing dot animation — active only while in 'searching' state
  useEffect(() => {
    if (matchStatus !== 'searching') {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [matchStatus, scale]);

  // Subscribe to socket connect events. The callback fires immediately if the
  // socket is already connected, so trigger reaches 1 on the first render cycle.
  useEffect(() => {
    return subscribeToConnect(() => setTrigger(t => t + 1));
  }, []);

  // Attempt to match on each trigger bump (initial connect + retries).
  useEffect(() => {
    // trigger === 0 means we haven't received a connect event yet — wait.
    if (trigger === 0) return;

    if (!problemId) {
      setMatchStatus('error');
      return;
    }

    if (!getSocket()?.connected) return;

    let cancelled = false;

    requestSession(problemId)
      .then(ack => {
        if (cancelled) return;
        if (ack.status === 'matched') {
          router.replace(`/user/session/${ack.sessionId}`);
        } else if (ack.status === 'no_volunteer') {
          setMatchStatus('no_volunteer');
        } else {
          setMatchStatus('error');
        }
      })
      .catch(() => {
        if (!cancelled) setMatchStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [trigger, problemId, router]);

  const retry = () => {
    setMatchStatus('searching');
    setTrigger(t => t + 1);
  };

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {matchStatus === 'searching' && (
          <>
            <Animated.View style={[styles.dot, dotStyle]} />
            <AppText
              variant="title3"
              emphasis="emphasized"
              color="primary"
              textAlign="center"
            >
              Connecting You
            </AppText>
            <AppText variant="caption2" textAlign="center" color="accent">
              Looking for an available volunteer…
            </AppText>
          </>
        )}

        {matchStatus === 'no_volunteer' && (
          <>
            <AppText
              variant="title3"
              emphasis="emphasized"
              color="primary"
              textAlign="center"
            >
              No Volunteers Available
            </AppText>
            <AppText variant="body" textAlign="center" color="accent">
              All volunteers are currently busy. Please try again in a moment.
            </AppText>
            <Pressable onPress={retry} style={styles.actionButton}>
              <AppText variant="body" style={styles.actionButtonText}>
                Try Again
              </AppText>
            </Pressable>
          </>
        )}

        {matchStatus === 'error' && (
          <>
            <AppText
              variant="title3"
              emphasis="emphasized"
              color="primary"
              textAlign="center"
            >
              Something Went Wrong
            </AppText>
            <AppText variant="body" textAlign="center" color="accent">
              {problemId ?
                'Unable to connect. Please try again.'
              : 'Session information is missing.'}
            </AppText>
            {problemId && (
              <Pressable onPress={retry} style={styles.actionButton}>
                <AppText variant="body" style={styles.actionButtonText}>
                  Try Again
                </AppText>
              </Pressable>
            )}
          </>
        )}

        <Pressable onPress={() => router.back()}>
          <AppText variant="caption1" color="accent">
            Cancel
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.s7,
    paddingHorizontal: theme.spacing.s6,
    alignItems: 'center',
    gap: theme.spacing.s6,
    width: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: theme.radius.full,
    backgroundColor: theme.background.accent,
  },
  actionButton: {
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    backgroundColor: theme.action.secondary,
    borderRadius: theme.radius.full,
  },
  actionButtonText: {
    color: '#fff',
  },
}));
