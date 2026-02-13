import React from 'react';
import { View, ImageSourcePropType } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Image } from 'expo-image';

interface HeroImageProps {
  source: ImageSourcePropType;
  aspectRatio?: number;
}

export const HeroImage = ({ source, aspectRatio = 2 }: HeroImageProps) => {
  return (
    <View style={styles.container}>
      <Image source={source} style={[styles.image, { aspectRatio }]} />
    </View>
  );
};

const styles = StyleSheet.create(theme => ({
  container: {
    width: '100%',
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
  },
}));
