import { Platform, TextStyle } from "react-native";

/**
 * Font family per platform
 * - iOS: System font (SF Pro)
 * - Android: Poppins
 */

const fontFamily = Platform.select({
  ios: undefined, // (system font)
  android: "Poppins",
});

/**
 * Font weights (numeric for cross-platform consistency)
 */
const weight = {
  regular: "400",
  medium: "500",
  semiBold: "600",
} as const;

/**
 * Base text style applied to all tokens
 */
const baseText: TextStyle = {
  fontFamily,
  includeFontPadding: false, // Android fix for vertical alignment
};

/**
 * Typography tokens for the app.
 *
 * Provides standard font sizes, weights, and line heights for both iOS and Android.
 * iOS uses SF Pro (system), Android uses Poppins.
 *
 * These tokens are the **foundation layer** for all text styles in the app.
 *
 * @example
 * import { typography, textStyles } from '@/theme/foundations/typography';
 *
 * <Text style={typography.headingXL}>Page Title</Text>
 * <Text style={textStyles.body}>Body text goes here</Text>
 */

export const typography = {
  /* ------------------- Headings ------------------- */

  headingXL: {
    ...baseText,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: weight.semiBold,
  } as TextStyle,

  headingLG: {
    ...baseText,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: weight.semiBold,
  } as TextStyle,

  headingMD: {
    ...baseText,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: weight.semiBold,
  } as TextStyle,

  headingSM: {
    ...baseText,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: weight.semiBold,
  } as TextStyle,

  /* ------------------- Body Text ------------------- */

  bodyLG: {
    ...baseText,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: weight.medium,
  } as TextStyle,

  bodyMD: {
    ...baseText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: weight.medium,
  } as TextStyle,

  bodySM: {
    ...baseText,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: weight.regular,
  } as TextStyle,

  bodyXS: {
    ...baseText,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: weight.regular,
  } as TextStyle,
};

/**
 * textStyles provides semantic aliases for screens and components.
 *
 * @property screenTitle - Large page titles.
 * @property sectionTitle - Section headings.
 * @property cardTitle - Card-level headings.
 * @property listHeader - List item headings.
 * @property body - Primary body text.
 * @property bodySecondary - Secondary body text (smaller or less emphasis).
 * @property caption - Small captions, hints, or labels.
 *
 * @example
 * <Text style={textStyles.screenTitle}>Home</Text>
 * <Text style={textStyles.caption}>Last updated 3 mins ago</Text>
 */

export const textStyles = {
  screenTitle: typography.headingXL,
  sectionTitle: typography.headingLG,
  cardTitle: typography.headingMD,
  listHeader: typography.headingSM,

  body: typography.bodyMD,
  bodySecondary: typography.bodySM,
  caption: typography.bodyXS,
};
