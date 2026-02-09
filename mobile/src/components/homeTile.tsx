import { View } from 'react-native';
import React from 'react';
import { AppText } from './AppText';
import { Image, ImageSource } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';

interface HomeTileProps {
  title: string;
  description: string;
  icon?: ImageSource;
  onPress?: () => void;
}

const HomeTile = ({ title, description, icon, onPress }: HomeTileProps) => {
  return (
    <View style={styles.tile}>
      <AppText variant="subhead" emphasis="emphasized" textAlign="center">
        {title}
      </AppText>
      <AppText variant="footnote" textAlign="center">
        {description}
      </AppText>
      <Image source={icon} style={styles.icon} contentFit="contain" />
    </View>
  );
};

export default HomeTile;

const styles = StyleSheet.create(theme => ({
  tile: {
    flex: 1,
    backgroundColor: theme.background.default,
    padding: theme.spacing.s4,
    borderRadius: theme.radius.xxlSoft,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: theme.elevation.level2,
    gap: theme.spacing.s1,
  },
  icon: {
    width: 24,
    height: 24,
  },
}));
