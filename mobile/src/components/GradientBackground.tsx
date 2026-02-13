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
