import React from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import { StyleProp, ViewStyle } from 'react-native';

interface GradientBackgroundProps extends Omit<
  LinearGradientProps,
  'colors' | 'style'
> {
  colors?: LinearGradientProps['colors'];
  style?: StyleProp<ViewStyle>;
  useDefaultStyle?: boolean;
}

/**
 * A flexible gradient background component that wraps LinearGradient with theme support.
 *
 * @component
 * @example
 * // Using default theme gradient
 * <GradientBackground />
 *
 * @example
 * // Using custom colors with additional props
 * <GradientBackground
 *   colors={['#F6E0FF', '#F9FBFF', '#D2ECFE']}
 *   start={{ x: 0, y: 0 }}
 *   end={{ x: 1, y: 1 }}
 *   locations={[0.38, 0.63, 0.8]}
 * />
 *
 * @param {LinearGradientProps['colors']} [colors] - Array of gradient colors. Uses theme.gradient.backgroundPrimary if not provided
 * @param {StyleProp<ViewStyle>} [style] - Custom style to apply
 * @param {boolean} [useDefaultStyle=true] - Whether to use default absolute positioning style
 * @param {...LinearGradientProps} props - All other LinearGradient props (start, end, locations, etc.)
 */
export const GradientBackground = ({
  colors,
  style,
  useDefaultStyle = true,
  ...props
}: GradientBackgroundProps) => {
  const { theme } = useUnistyles();

  const gradientStyle = useDefaultStyle ? [styles.gradient, style] : style;

  return (
    <LinearGradient
      colors={colors || theme.gradient.backgroundPrimary}
      style={gradientStyle}
      {...props}
    />
  );
};

const styles = StyleSheet.create(() => ({
  gradient: {
    position: 'absolute',
    inset: 0,
  },
}));
