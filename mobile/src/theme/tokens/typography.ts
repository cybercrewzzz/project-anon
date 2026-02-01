import { Platform, TextStyle } from 'react-native';

type FontGroup = 'text' | 'display' | 'displayLarge';

const getFontFamily = (group: FontGroup) => {
  if (Platform.OS === 'ios') return undefined;

  switch (group) {
    case 'displayLarge':
      return 'Inter 28pt';
    case 'display':
      return 'Inter 24pt';
    case 'text':
    default:
      return 'Inter 18pt';
  }
};

const weight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

export type TextEmphasis = 'regular' | 'emphasized';

const sizes = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
  },
} as const;

const fontGroupMap: Record<TextVariant, FontGroup> = {
  largeTitle: 'displayLarge',
  title1: 'displayLarge',
  title2: 'display',
  title3: 'display',
  headline: 'text',
  body: 'text',
  callout: 'text',
  subhead: 'text',
  footnote: 'text',
  caption1: 'text',
  caption2: 'text',
};

const createStyle = (
  key: keyof typeof sizes,
  fontWeight: TextStyle['fontWeight'],
): TextStyle => {
  const size = sizes[key];
  const FontGroup = fontGroupMap[key];

  return {
    includeFontPadding: false,
    fontFamily: getFontFamily(FontGroup),
    fontWeight,
    fontSize: size.fontSize,
    lineHeight: size.lineHeight,
  };
};

export const typography = {
  largeTitle: {
    regular: createStyle('largeTitle', weight.regular),
    emphasized: createStyle('largeTitle', weight.bold),
  },
  title1: {
    regular: createStyle('title1', weight.regular),
    emphasized: createStyle('title1', weight.bold),
  },
  title2: {
    regular: createStyle('title2', weight.regular),
    emphasized: createStyle('title2', weight.bold),
  },
  title3: {
    regular: createStyle('title3', weight.regular),
    emphasized: createStyle('title3', weight.semiBold),
  },
  headline: {
    regular: createStyle('headline', weight.semiBold),
    emphasized: createStyle('headline', weight.semiBold),
  },
  body: {
    regular: createStyle('body', weight.regular),
    emphasized: createStyle('body', weight.semiBold),
  },
  callout: {
    regular: createStyle('callout', weight.regular),
    emphasized: createStyle('callout', weight.semiBold),
  },
  subhead: {
    regular: createStyle('subhead', weight.regular),
    emphasized: createStyle('subhead', weight.semiBold),
  },
  footnote: {
    regular: createStyle('footnote', weight.regular),
    emphasized: createStyle('footnote', weight.semiBold),
  },
  caption1: {
    regular: createStyle('caption1', weight.regular),
    emphasized: createStyle('caption1', weight.semiBold),
  },
  caption2: {
    regular: createStyle('caption2', weight.regular),
    emphasized: createStyle('caption2', weight.semiBold),
  },
} satisfies Record<keyof typeof sizes, Record<TextEmphasis, TextStyle>>;

export type TextVariant = keyof typeof typography;
