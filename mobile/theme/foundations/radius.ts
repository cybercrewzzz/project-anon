import { Platform } from "react-native";

/**
 * Radius tokens for the app.
 *
 * Defines standard border-radius values for components.
 * iOS uses softer, larger radii.
 * Android uses tighter Material-style radii.
 *
 * `Soft` variants represent visually friendlier curves.
 *
 * Includes a `pill` token for fully rounded elements.
 *
 * @example
 * import { radius } from '@/theme/foundations/radius';
 *
 * <View style={{ borderRadius: radius.md }} />
 * <Button style={{ borderRadius: radius.pill }} />
 */

const ios = {
  xs: 16,
  sm: 20,
  smSoft: 20,
  md: 26,
  mdSoft: 26,
  lg: 30,
  lgSoft: 30,
  xl: 34,
  xlSoft: 34,
  xxl: 38,
  xxlSoft: 38,
  pill: 999,
};

const android = {
  xs: 8,
  sm: 12,
  smSoft: 14,
  md: 12,
  mdSoft: 17,
  lg: 20,
  lgSoft: 22,
  xl: 24,
  xlSoft: 26,
  xxl: 26,
  xxlSoft: 30,
  pill: 999,
};

/**
 * Unified radius tokens
 * Use these everywhere instead of raw numbers
 */
export const radius = Platform.OS === "ios" ? ios : android;
