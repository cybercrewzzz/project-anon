import { View, Pressable } from 'react-native';
import React from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { common } from '@/theme/palettes/common';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ComingSoon() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F6E0FF', '#F9FBFF', '#D2ECFE']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={common.black} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Image
          source={require('@/assets/images/logo.webp')}
          style={styles.logo}
          contentFit="contain"
        />
        <AppText variant="title1" emphasis="emphasized" textAlign="center" style={styles.title}>
          Coming Soon
        </AppText>
        <AppText variant="body" color="muted" textAlign="center" style={styles.subtitle}>
          We are working hard to bring this feature to you. Stay tuned for exciting updates!
        </AppText>

        <Pressable style={styles.returnButton} onPress={() => router.back()}>
          <AppText variant="callout" emphasis="emphasized" color="secondary">
            Return Home
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    backgroundColor: theme.background.default,
  },
  gradient: {
    position: 'absolute',
    inset: 0,
  },
  header: {
    paddingHorizontal: theme.spacing.s4,
    paddingTop: theme.spacing.s4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.full,
    boxShadow: theme.elevation.level1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s6,
    gap: theme.spacing.s4,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: theme.spacing.s6,
  },
  title: {
    color: theme.text.primary,
  },
  subtitle: {
    marginBottom: theme.spacing.s6,
    maxWidth: 300,
  },
  returnButton: {
    backgroundColor: theme.action.primary,
    paddingVertical: theme.spacing.s4,
    paddingHorizontal: theme.spacing.s7,
    borderRadius: theme.radius.full,
    boxShadow: theme.elevation.level2,
  },
}));
