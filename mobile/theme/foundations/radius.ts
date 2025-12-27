import { Platform } from 'react-native';

const ios = {
  xs: 16,
  sm: 20,
  md: 26,
  lg: 30,
  xl: 34,
  xxl: 38,
};

const android = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

/**
 * Unified radius tokens
 * Use these everywhere instead of raw numbers
 */
export const radius = {
  xs: Platform.OS === 'ios' ? ios.xs : android.xs,
  sm: Platform.OS === 'ios' ? ios.sm : android.sm,
  md: Platform.OS === 'ios' ? ios.md : android.md,
  lg: Platform.OS === 'ios' ? ios.lg : android.lg,
  xl: Platform.OS === 'ios' ? ios.xl : android.xl,
  xxl: Platform.OS === 'ios' ? ios.xxl : android.xxl,

  /**
   * Pill / fully rounded elements
   * Use with fixed height components
   */
  pill: 999,
};
