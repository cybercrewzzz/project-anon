import { View } from 'react-native';
import React from 'react';
import { AppText, AppTextProps } from './AppText';
import { StyleSheet } from 'react-native-unistyles';

interface AuthHeaderProps {
  titleColor?: AppTextProps['color'];
}

const AuthHeader = ({ titleColor }: AuthHeaderProps) => {
  return (
    <View style={styles.container}>
      <AppText variant="largeTitle" emphasis="emphasized">
        Anora App
      </AppText>
      <AppText variant="title1" emphasis="emphasized" color={titleColor}>
        Sign In
      </AppText>
    </View>
  );
};

export default AuthHeader;

const styles = StyleSheet.create(theme => ({
  container: {
    gap: theme.spacing.s7,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
