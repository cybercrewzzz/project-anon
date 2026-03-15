import { StyleSheet } from 'react-native-unistyles';
import { userLightTheme } from './roles/user/light';
import { volunteerLightTheme } from './roles/volunteer/light';
import { AppTheme } from './appTheme';

declare module 'react-native-unistyles' {
  export interface UnistylesThemes {
    userLight: AppTheme;
    volunteerLight: AppTheme;
  }
}

StyleSheet.configure({
  themes: {
    userLight: userLightTheme,
    volunteerLight: volunteerLightTheme,
  },
  settings: {
    initialTheme: () => 'userLight',
  },
});
