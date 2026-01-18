import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: undefined,
  android: 'Poppins',
});

export const weight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
} as const;

const baseText: TextStyle = {
  fontFamily,
  includeFontPadding: false,
};

export const typography = {
  headingXL: {
    ...baseText,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: weight.semiBold,
  },
  headingLG: {
    ...baseText,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: weight.semiBold,
  },
  headingMD: {
    ...baseText,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: weight.semiBold,
  },
  headingSM: {
    ...baseText,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: weight.semiBold,
  },
  bodyLG: {
    ...baseText,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: weight.medium,
  },
  bodyMD: {
    ...baseText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: weight.medium,
  },
  bodySM: {
    ...baseText,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: weight.regular,
  },
  bodyXS: {
    ...baseText,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: weight.regular,
  },
} satisfies Record<string, TextStyle>;

export const textStyles = {
  screenTitle: typography.headingXL,
  sectionTitle: typography.headingLG,
  cardTitle: typography.headingMD,
  listHeader: typography.headingSM,
  body: typography.bodyMD,
  bodySecondary: typography.bodySM,
  caption: typography.bodyXS,
} as const;

export type TypographyKey = keyof typeof typography;
export type TextStyleKey = keyof typeof textStyles;
