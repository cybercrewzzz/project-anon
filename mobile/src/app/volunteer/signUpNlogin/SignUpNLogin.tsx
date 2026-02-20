import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';

const SignUpNLogin = () => {
  return (
      <View style={styles.container}>
          <View style={styles.screenTitleContainer}>
              <AppText variant="largeTitle" color="muted" emphasis="emphasized"> Hello! </AppText>
          </View>

    </View>
  );
};

export default SignUpNLogin;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.surface.primary,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
    },
  screenTitleContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: rt.insets.top,
  },
}));

