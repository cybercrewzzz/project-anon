import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';
import { AuthButton } from '@/components/AuthButton';
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
        <AuthButton label="Login" color="#00A9D3" />
        <View style={styles.dividerText}>
          <AppText variant="headline" color="primary">
            OR
          </AppText>
        </View>
        <AuthButton label="Sign Up" color="#0669B8" />
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
}));
