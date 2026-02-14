import { View } from 'react-native';
import React from 'react';
import { AppText } from './AppText';
import { StyleSheet } from 'react-native-unistyles';
import { Image, ImageSource } from 'expo-image';

const HorizontalBar = () => {
  return <View style={styles.horizontalBar}></View>;
};

const Icon = ({ source }: { source: ImageSource }) => {
  return <Image source={source} style={styles.icon} contentFit="contain" />;
};

const OAuthSignIn = () => {
  return (
    <View style={styles.section}>
      <AppText variant="callout" emphasis="emphasized" color="subtle1">
        OR
      </AppText>
      <View style={styles.signIn}>
        <HorizontalBar />
        <AppText variant="subhead" color="subtle1">
          Sign in using
        </AppText>
        <HorizontalBar />
      </View>
      <View style={styles.iconContainer}>
        <Icon source={require('@/assets/images/apple.webp')} />
        <Icon source={require('@/assets/images/google.webp')} />
        <Icon source={require('@/assets/images/facebook.webp')} />
      </View>
    </View>
  );
};

export default OAuthSignIn;

const styles = StyleSheet.create(theme => ({
  section: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s5,
  },
  signIn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s3,
  },
  horizontalBar: {
    borderColor: theme.text.subtle1,
    borderTopWidth: 1,
    width: '15%',
    height: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    gap: theme.spacing.s5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
  },
}));
