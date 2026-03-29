import { View, Pressable } from 'react-native';
import React from 'react';
import { AppText } from './AppText';
import { StyleSheet } from 'react-native-unistyles';
import { Image, ImageSource } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const HorizontalBar = () => {
  return <View style={styles.horizontalBar}></View>;
};

const Icon = ({
  source,
  customSize,
}: {
  source: ImageSource;
  customSize?: number;
}) => {
  const shakeTranslation = useSharedValue(0);
  const tooltipOpacity = useSharedValue(0);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeTranslation.value }],
    };
  });

  const animatedTooltipStyle = useAnimatedStyle(() => {
    return {
      opacity: tooltipOpacity.value,
      transform: [{ translateY: tooltipOpacity.value * 5 - 5 }],
    };
  });

  const handlePress = () => {
    // Subtle Haptic Feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Shake animation (subtle "no" - left, right, left, right, center)
    const SHAKE_AMOUNT = 5;
    const SHAKE_DURATION = 50;

    shakeTranslation.value = withSequence(
      withTiming(-SHAKE_AMOUNT, { duration: SHAKE_DURATION / 2 }),
      withRepeat(
        withTiming(SHAKE_AMOUNT, { duration: SHAKE_DURATION }),
        3,
        true,
      ),
      withTiming(0, { duration: SHAKE_DURATION / 2 }),
    );

    // Tooltip animation (fade in quickly, stay 1.5s, fade out smoothly)
    tooltipOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1500, withTiming(0, { duration: 300 })),
    );
  };

  return (
    <View style={styles.iconWrapper}>
      <Animated.View
        style={[styles.tooltipContainer, animatedTooltipStyle]}
        pointerEvents="none"
      >
        <View style={styles.tooltip}>
          <AppText
            variant="caption1"
            emphasis="emphasized"
            style={styles.tooltipText}
          >
            OAuth coming soon!
          </AppText>
        </View>
        <View style={styles.tooltipArrow} />
      </Animated.View>

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="OAuth sign-in option"
        accessibilityHint="Shows a message that OAuth sign-in is coming soon"
      >
        <Animated.View style={animatedIconStyle}>
          <Image
            source={source}
            style={[
              styles.icon,
              customSize ? { width: customSize, height: customSize } : null,
            ]}
            contentFit="contain"
          />
        </Animated.View>
      </Pressable>
    </View>
  );
};

const OAuthSignIn = () => {
  return (
    <View style={styles.section}>
      <AppText variant="callout" emphasis="emphasized" color="subtle1">
        OR
      </AppText>
      <View style={styles.signIn}>
        <HorizontalBar />
        <AppText variant="subhead" color="subtle1">
          Sign in using
        </AppText>
        <HorizontalBar />
      </View>
      <View style={styles.iconContainer}>
        <Icon source={require('@/assets/icons/apple-logo.svg')} />
        <Icon source={require('@/assets/icons/google-logo.svg')} />
        <Icon
          source={require('@/assets/icons/facebook-logo.svg')}
          customSize={46}
        />
      </View>
    </View>
  );
};

export default OAuthSignIn;

const styles = StyleSheet.create(theme => ({
  section: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s5,
  },
  signIn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s3,
  },
  horizontalBar: {
    borderColor: theme.text.subtle1,
    borderTopWidth: 1,
    width: '15%',
    height: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    gap: theme.spacing.s5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // To ensure tooltips can overlap if needed
  },
  iconWrapper: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  icon: {
    width: 40,
    height: 40,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    alignItems: 'center',
    zIndex: 10,
    width: 130, // Fixed width prevents wrapping jumps
  },
  tooltip: {
    backgroundColor: theme.text.primary,
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: theme.spacing.s2,
    borderRadius: theme.radius.m,
    boxShadow: theme.elevation.level3,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.text.primary,
    marginTop: -1, // Slight overlap avoids tiny gaps
  },
  tooltipText: {
    color: theme.background.default, // Inverse color for tooltip
    textAlign: 'center',
  },
}));
