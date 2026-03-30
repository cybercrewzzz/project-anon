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
import { getSocket, subscribeToConnect } from '@/api/socket';

type MatchStatus = 'searching' | 'matched' | 'timeout' | 'error';

export default function WaitingScreen() {
  const router = useRouter();
  // sessionId is passed by the P2P connect screen after POST /session/connect
  // returned status='waiting'. The session already exists on the server.
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [matchStatus, setMatchStatus] = useState<MatchStatus>(
    sessionId ? 'searching' : 'error',
  );

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

  // Listen for session:matched — the server emits this when a volunteer
  // accepts the waiting session. We do NOT re-request here; the HTTP POST
  // already created the session. We only listen.
  useEffect(() => {
    if (!sessionId) return;

    const onMatched = (payload: { sessionId: string }) => {
      // Only navigate if it's for our session
      if (payload.sessionId === sessionId) {
        setMatchStatus('matched');
        router.replace(`/user/session/${sessionId}`);
      }
    };

    const onSessionEnded = (payload: {
      sessionId: string;
      reason?: string;
    }) => {
      if (payload.sessionId !== sessionId) return;
      // The match:timeout processor cancelled the session
      if (payload.reason === 'no_volunteer' || payload.reason === 'timeout') {
        setMatchStatus('timeout');
      }
    };

    // Attach handlers immediately if the socket exists
    const attachListeners = () => {
      const socket = getSocket();
      if (!socket) return;

      socket.on('session:matched', onMatched);
      socket.on('session:ended', onSessionEnded);
    };

    attachListeners();

    // Re-attach when socket reconnects
    const unsub = subscribeToConnect(attachListeners);

    return () => {
      unsub();
      const socket = getSocket();
      if (socket) {
        socket.off('session:matched', onMatched);
        socket.off('session:ended', onSessionEnded);
      }
    };
  }, [sessionId, router]);

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

        {matchStatus === 'timeout' && (
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
            <Pressable
              onPress={() => router.back()}
              style={styles.actionButton}
            >
              <AppText variant="body" style={styles.actionButtonText}>
                Go Back
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
              Session information is missing.
            </AppText>
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
    color: theme.action.secondary,
  },
}));
