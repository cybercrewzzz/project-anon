import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';
import { FullWidthButton } from '@/components/FullWidthButton';
//import { router } from 'expo-router';

const SignUpNLogin = () => {
  return (
    <View style={styles.container}>
      <View style={styles.screenTitleContainer}>
        <AppText variant="largeTitle" color="primary" emphasis="emphasized">
          Hello!
        </AppText>
      </View>
      <View style={styles.buttonContainer}>
        <View>
          <FullWidthButton>
            <AppText variant="headline" color="secondary">
              Login
            </AppText>
          </FullWidthButton>
        </View>
        <View style={styles.dividerText}>
          <AppText variant="headline" color="primary">
            OR
          </AppText>
        </View>
        <View>
          <FullWidthButton style={styles.signUpButton}>
            <AppText variant="headline" color="secondary">
              Sign Up
            </AppText>
          </FullWidthButton>
        </View>
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
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 64,
  },
  dividerText: {
    alignItems: 'center',
    marginVertical: 16,
  },
  signUpButton: {
    backgroundColor: theme.action.primary,
    paddingVertical: theme.spacing.s4,
    alignItems: 'center',
    borderRadius: theme.radius.full,
  },
}));
