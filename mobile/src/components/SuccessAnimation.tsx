import React, { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';

const CIRCLE_COUNT = 20;
const DURATION = 5000; // Expected to live for roughly 5 seconds

// Types
interface BubbleSeed {
  size: number;
  baseR: number;
  baseAngle: number;
  color: string;
  index: number;
}

// ---------------------------------------------------------
// Subcomponents isolated to avoid Hooks in callbacks
// ---------------------------------------------------------

const OrbitingBubble = ({
  seed,
  lifeProgress,
}: {
  seed: BubbleSeed;
  lifeProgress: SharedValue<number>;
}) => {
  const style = useAnimatedStyle(() => {
    const t = lifeProgress.value;
    const emerge = interpolate(t, [0, 1500], [0, 1], Extrapolation.CLAMP);
    
    // Smooth orbit path
    const angle = seed.baseAngle + (t / 1500) * Math.PI;
    const driftR = seed.baseR + Math.sin(t / 800 + seed.index) * 6;
    
    // Final explosion scale (radius jumps significantly while size zeroes out)
    const explodeRMultiplier = interpolate(
      t,
      [DURATION - 1000, DURATION],
      [1, 5], // Fly way out past the screen bounds
      Extrapolation.CLAMP
    );
    
    const explodeFade = interpolate(
      t,
      [DURATION - 1000, DURATION - 200],
      [1, 0], // Fully fade out near end
      Extrapolation.CLAMP
    );
    
    const currentR = driftR * emerge * explodeRMultiplier;
    const translateX = Math.cos(angle) * currentR;
    const translateY = Math.sin(angle) * currentR;

    return {
      position: 'absolute',
      width: seed.size,
      height: seed.size,
      borderRadius: seed.size / 2,
      backgroundColor: seed.color,
      transform: [
        { translateX }, 
        { translateY }, 
        { scale: emerge * explodeFade } // Shrink visually while fading
      ],
      opacity: 0.8 * explodeFade,
    };
  });

  return <Animated.View style={style} />;
};

// ---------------------------------------------------------
// Main Component
// ---------------------------------------------------------

export function SuccessAnimation() {
  const { theme } = useUnistyles();

  const colors = [
    theme.action.primary,
    theme.action.secondary,
    theme.text.subtle1,
    theme.state.success,
  ];

  const [bubbleSeeds] = useState<BubbleSeed[]>(() =>
    Array.from({ length: CIRCLE_COUNT }).map((_, i) => ({
      index: i,
      // Smaller circles: 4 to 12 variations
      size: 4 + (i % 3) * 4,
      // Distribute tightly and farther out in rings
      baseR: 50 + (i % 4) * 15,
      baseAngle: (i / CIRCLE_COUNT) * 2 * Math.PI,
      color: colors[i % colors.length],
    }))
  );

  const lifeProgress = useSharedValue(0);
  const heartScale = useSharedValue(1);

  useEffect(() => {
    lifeProgress.value = withTiming(DURATION, {
      duration: DURATION,
      easing: Easing.linear,
    });

    // Smooth, calming "breathing" heart cycle
    heartScale.value = withRepeat(
      withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite loop
      true // Reverse continuously for inhale/exhale
    );
  }, [lifeProgress, heartScale]);

  const heartStyle = useAnimatedStyle(() => {
    const t = lifeProgress.value;
    
    // Explode outward (zoom-out blast with scale reduction)
    const explodeScale = interpolate(
      t,
      [DURATION - 1000, DURATION],
      [1, 0], // Heart shrinks into nothing at explosion phase
      Extrapolation.CLAMP
    );
    
    const opacity = interpolate(
      t,
      [0, 500, DURATION - 1000, DURATION - 200],
      [0, 1, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      // Inherit the breathing loop * exploding termination
      transform: [{ scale: heartScale.value * explodeScale }],
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

      <Animated.View style={heartStyle}>
        <Ionicons name="heart" size={80} color={theme.action.primary} />
      </Animated.View>
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
