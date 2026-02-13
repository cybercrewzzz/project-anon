import React from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import { ColorValue } from 'react-native';

interface GradientBackgroundProps {
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
}

export const GradientBackground = ({ colors }: GradientBackgroundProps) => {
  const { theme } = useUnistyles();

  return (
    <LinearGradient
      colors={colors || theme.gradient.backgroundPrimary}
      style={styles.gradient}
    />
  );
};

const styles = StyleSheet.create(() => ({
  gradient: {
    position: 'absolute',
    inset: 0,
  },
}));
