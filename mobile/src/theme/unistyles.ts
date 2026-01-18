import { StyleSheet } from 'react-native-unistyles';

export const appTheme = {
  colors: {
    text: {
      primary: '#050607',
    },
  },
};

declare module 'react-native-unistyles' {
  export interface UnistylesThemes {
    textTest: typeof appTheme;
  }
}

StyleSheet.configure({
  themes: {
    textTest: appTheme,
  },
});
