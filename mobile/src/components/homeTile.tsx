import { Pressable } from 'react-native';
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9 }]}
    >
      <AppText variant="subhead" emphasis="emphasized" textAlign="center">
        {title}
      </AppText>
      <AppText variant="caption1" textAlign="center">
        {description}
      </AppText>
      <Image source={icon} style={styles.icon} contentFit="contain" />
    </Pressable>
  );
};

export default HomeTile;

const styles = StyleSheet.create(theme => ({
  tile: {
    flex: 1,
    backgroundColor: theme.background.default,
    paddingVertical: theme.spacing.s4,
    paddingHorizontal: theme.spacing.s3,
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
