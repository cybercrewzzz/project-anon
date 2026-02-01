import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: undefined,
  android: 'Poppins',
});

const weight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

const baseText: TextStyle = {
  fontFamily,
  includeFontPadding: false,
};

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

export const typography = {
  largeTitle: {
    regular: {
      ...baseText,
      ...sizes.largeTitle,
      fontWeight: weight.regular,
    },
    emphasized: {
      ...baseText,
      ...sizes.largeTitle,
      fontWeight: weight.bold,
    },
  },
  title1: {
    regular: {
      ...baseText,
      ...sizes.title1,
      fontWeight: weight.regular,
    },
    emphasized: {
      ...baseText,
      ...sizes.title1,
      fontWeight: weight.bold,
    },
  },
  title2: {
    regular: {
      ...baseText,
      ...sizes.title2,
      fontWeight: weight.regular,
    },
    emphasized: {
      ...baseText,
      ...sizes.title2,
      fontWeight: weight.bold,
    },
  },
  title3: {
    regular: {
      ...baseText,
      ...sizes.title3,
      fontWeight: weight.regular,
    },
    emphasized: {
      ...baseText,
      ...sizes.title3,
      fontWeight: weight.semiBold,
    },
  },
  headline: {
    regular: {
      ...baseText,
      ...sizes.headline,
      fontWeight: weight.semiBold,
    },
    emphasized: {
      ...baseText,
      ...sizes.headline,
      fontWeight: weight.semiBold,
    },
  },
  body: {
    regular: {
      ...baseText,
      ...sizes.body,
      fontWeight: weight.regular,
    },
    emphasized: {
      ...baseText,
      ...sizes.body,
      fontWeight: weight.semiBold,
    },
  },
  callout: {
    regular: {
      ...baseText,
      ...sizes.callout,
      fontWeight: weight.regular,
    },
    emphasized: {
      ...baseText,
      ...sizes.callout,
      fontWeight: weight.semiBold,
    },
  },
  subhead: {
    regular: {
      ...baseText,
      ...sizes.subhead,
      fontWeight: weight.regular,
    },
    emphasized: {
      ...baseText,
      ...sizes.subhead,
      fontWeight: weight.semiBold,
    },
  },
  footnote: {
    regular: {
      ...baseText,
      ...sizes.footnote,
      fontWeight: weight.regular,
    },
    emphasized: {
      ...baseText,
      ...sizes.footnote,
      fontWeight: weight.semiBold,
    },
  },
  caption1: {
    regular: {
      ...baseText,
      ...sizes.caption1,
      fontWeight: weight.regular,
    },
    emphasized: {
      ...baseText,
      ...sizes.caption1,
      fontWeight: weight.semiBold,
    },
  },
  caption2: {
    regular: {
      ...baseText,
      ...sizes.caption2,
      fontWeight: weight.regular,
    },
    emphasized: {
      ...baseText,
      ...sizes.caption2,
      fontWeight: weight.semiBold,
    },
  },
} satisfies Record<keyof typeof sizes, Record<TextEmphasis, TextStyle>>;

export type TextVariant = keyof typeof typography;
