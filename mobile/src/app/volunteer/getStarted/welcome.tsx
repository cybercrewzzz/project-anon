import { AppText } from '@/components/AppText';
import { FullWidthButton } from '@/components/FullWidthButton';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';

const GradientBackground = withUnistyles(LinearGradient, theme => ({
  colors: theme.gradient.backgroundPrimary as unknown as [string, string, ...string[]],
}));

export default function Welcome() {
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <GradientBackground style={styles.gradient} />

      {/* Hero Logo */}
      <View style={styles.heroContainer}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      {/* Center Content */}
      <View style={styles.content}>
        <AppText variant="largeTitle" emphasis="emphasized" color="accent" textAlign="center">
          Welcome!
        </AppText>
        <AppText variant="body" color="subtle1" textAlign="center" style={styles.subtitle}>
          Connect with volunteers and get the support you need, in the language you understand.
        </AppText>
      </View>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <FullWidthButton onPress={() => router.push('/user/StartedScreens/selectLanguage')}>
          <AppText variant="headline" emphasis="emphasized" color="secondary">
            Get Started
          </AppText>
        </FullWidthButton>

        <Pressable onPress={() => router.push('/volunteer/getStarted/selectLanguage')}>
          <AppText variant="subhead" emphasis="emphasized" color="subtle1" textAlign="center">
            Continue as a Volunteer
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: rt.insets.top + theme.spacing.s6,
    paddingBottom: rt.insets.bottom + theme.spacing.s7,
    paddingHorizontal: theme.spacing.s5,
  },

  gradient: {
    position: 'absolute',
    inset: 0,
  },

  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 200,
    height: 200,
  },

  content: {
    alignItems: 'center',
    gap: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s4,
    paddingBottom: theme.spacing.s6,
  },

  subtitle: {
    maxWidth: 320,
  },

  actions: {
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing.s5,
  },
}));
