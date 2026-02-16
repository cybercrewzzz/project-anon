import React from 'react';
import { View, ImageSourcePropType } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Image } from 'expo-image';

interface HeroImageProps {
  source: ImageSourcePropType;
  aspectRatio?: number;
}

/**
 * A reusable hero image component with rounded corners and responsive sizing.
 *
 * @component
 * @example
 * <HeroImage source={require('@/assets/images/hero.webp')} />
 *
 * @example
 * <HeroImage
 *   source={require('@/assets/images/hero.webp')}
 *   aspectRatio={16/9}
 * />
 *
 * @param {ImageSourcePropType} source - The image source (required)
 * @param {number} [aspectRatio=2] - The aspect ratio of the image (width/height)
 */
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
