import { StyleSheet } from 'react-native-unistyles';
import { AppTheme, userLightTheme } from './roles/user/light';

declare module 'react-native-unistyles' {
  export interface UnistylesThemes {
    userLight: AppTheme;
  }
}

StyleSheet.configure({
  themes: {
    userLight: userLightTheme,
  },
});
