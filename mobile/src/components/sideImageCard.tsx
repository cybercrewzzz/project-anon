import { View, Pressable } from 'react-native';
import React from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from './AppText';
import { Image, ImageSource } from 'expo-image';

type ImagePosition = 'left' | 'right';

interface SideImageCardProps {
  title: string;
  description: string;
  image: ImageSource;
  ctaText?: string;
  ctaIcon?: ImageSource;
  onPress?: () => void;
  ImagePosition?: ImagePosition;
}

const SideImageCard = ({
  title,
  description,
  image,
  ctaText,
  ctaIcon,
  onPress,
  ImagePosition = 'right',
}: SideImageCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.Card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.Left}>
        <AppText variant="subhead" emphasis="emphasized">
          {title}
        </AppText>
        <AppText variant="footnote">{description}</AppText>
        <View style={styles.ctaText}>
          <AppText variant="subhead" emphasis="emphasized">
            {ctaText}
          </AppText>
          <Image source={ctaIcon} style={styles.ctaIcon} contentFit="contain" />
        </View>
      </View>
      <View style={styles.Right}>
        <Image source={image} style={styles.Image} />
      </View>
    </Pressable>
  );
};

export default SideImageCard;

const styles = StyleSheet.create(theme => ({
  Card: {
    flexDirection: 'row',
    padding: theme.spacing.s4,
    backgroundColor: theme.background.default,
    borderRadius: theme.radius.xlSoft,
    gap: theme.spacing.s4,
    boxShadow: theme.elevation.level2,
  },
  Left: {
    flex: 3,
    gap: theme.spacing.s2,
  },
  Right: {
    flex: 2,
    borderRadius: theme.radius.xxlSoft,
    overflow: 'hidden',
    margin: theme.spacing.s2,
  },
  Image: {
    position: 'absolute',
    inset: 0,
  },
  ctaText: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
    alignItems: 'center',
  },
  ctaIcon: {
    width: 16,
    height: 16,
  },
}));
