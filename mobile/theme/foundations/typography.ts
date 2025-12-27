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
 * Typography scale
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
 * Optional semantic aliases (recommended for screens)
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
