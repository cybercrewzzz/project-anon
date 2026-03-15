import { StyleSheet } from 'react-native-unistyles';
import { AppTheme, userLightTheme } from './roles/user/light';
import { VolunteerTheme, volunteerLightTheme } from './roles/volunteer/light';

declare module 'react-native-unistyles' {
  export interface UnistylesThemes {
    userLight: AppTheme;
    volunteerLight: VolunteerTheme;
  }
}

StyleSheet.configure({
  themes: {
    userLight: userLightTheme,
    volunteerLight: volunteerLightTheme,
  },
});
