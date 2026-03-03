import { AppText } from '@/components/AppText';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

export default function WaitingScreen() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [scale]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Animated.View style={[styles.dot, dotStyle]} />
        <AppText
          variant="title3"
          emphasis="emphasized"
          color="primary"
          textAlign="center"
        >
          Connecting You
        </AppText>
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
}));
