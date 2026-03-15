import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

const CIRCLE_COUNT = 20;
const DURATION = 5000;

interface BubbleSeed {
  size: number;
  baseR: number;
  baseAngle: number;
  color: string;
  index: number;
}

const OrbitingBubble = ({
  seed,
  lifeProgress,
}: {
  seed: BubbleSeed;
  lifeProgress: SharedValue<number>;
}) => {
  const style = useAnimatedStyle(() => {
    const t = lifeProgress.value;

    // Smooth fade in for the whole system over the first 500ms
    const systemFade = interpolate(t, [0, 500], [0, 1], Extrapolation.CLAMP);

    // Orbit path around the big circle
    const angle = seed.baseAngle + (t / 1500) * Math.PI;

    // Base radius (no spiral from center)
    const baseRadius = seed.baseR;

    // Particle motion (wobble / drift)
    // Use different frequencies based on seed.index to make them look independent
    const driftX = Math.sin(t / 400 + seed.index * 2) * 6;
    const driftY = Math.cos(t / 500 + seed.index * 3) * 6;

    // Pop in and pop out effect (pulsing scale and opacity)
    // We oscillate between 0 and 1
    const popCycle = (Math.sin(t / 300 + seed.index) + 1) / 2;
    // Scale goes from 0.4 to 1.2
    const popScale = 0.4 + popCycle * 0.8;
    // Opacity goes from 0.2 to 1.0 blending with the final fade out
    const popOpacity = 0.2 + popCycle * 0.8;

    // Explode outward at the very end
    const explodeRMultiplier = interpolate(
      t,
      [DURATION - 1200, DURATION],
      [1, 6],
      Extrapolation.CLAMP,
    );

    const explodeFade = interpolate(
      t,
      [DURATION - 800, DURATION],
      [1, 0],
      Extrapolation.CLAMP,
    );

    const currentR = baseRadius * explodeRMultiplier;
    // Apply orbit + particle drift
    const translateX = Math.cos(angle) * currentR + driftX;
    const translateY = Math.sin(angle) * currentR + driftY;

    return {
      position: 'absolute',
      width: seed.size,
      height: seed.size,
      borderRadius: seed.size / 2,
      backgroundColor: seed.color,
      transform: [{ translateX }, { translateY }, { scale: popScale }],
      opacity: popOpacity * explodeFade * systemFade,
    };
  });

  return <Animated.View style={style} />;
};

export function SuccessAnimation() {
  const { theme } = useUnistyles();

  const colors = useMemo(
    () => [
      theme.action.primary,
      theme.action.secondary,
      theme.text.subtle1,
      theme.state.success,
    ],
    [theme],
  );

  const bubbleSeeds = useMemo<BubbleSeed[]>(
    () =>
      Array.from({ length: CIRCLE_COUNT }).map((_, i) => ({
        index: i,
        // Varied sizes
        size: 6 + (i % 3) * 4,
        // Distribute tightly and farther out in rings
        baseR: 60 + (i % 4) * 15,
        baseAngle: (i / CIRCLE_COUNT) * 2 * Math.PI,
        color: colors[i % colors.length],
      })),
    [colors],
  );

  const lifeProgress = useSharedValue(0);
  const breatheScale = useSharedValue(1);

  useEffect(() => {
    lifeProgress.value = withTiming(DURATION, {
      duration: DURATION,
      easing: Easing.linear,
    });

    // Circular gentle breathing
    breatheScale.value = withRepeat(
      withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [lifeProgress, breatheScale]);

  const centralCircleStyle = useAnimatedStyle(() => {
    const t = lifeProgress.value;

    // Smooth massive zoom in / explosion
    const explodeScale = interpolate(
      t,
      [DURATION - 1200, DURATION],
      [1, 15],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      t,
      [0, 500, DURATION - 500, DURATION],
      [0, 1, 1, 0],
      Extrapolation.CLAMP,
    );

    return {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.action.primary,
      transform: [{ scale: breatheScale.value * explodeScale }],
      opacity,
      justifyContent: 'center',
      alignItems: 'center',
    };
  });

  return (
    <View style={styles.container}>
      {bubbleSeeds.map((seed, i) => (
        <OrbitingBubble
          key={`bubble-${i}`}
          seed={seed}
          lifeProgress={lifeProgress}
        />
      ))}

      <Animated.View style={centralCircleStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 185,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
