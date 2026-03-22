import { View, ActivityIndicator } from 'react-native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';
import { useRouter } from 'expo-router';
import { common } from '@/theme/palettes/common';
import { LinearGradient } from 'expo-linear-gradient';

export default function ConnectingScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to chat after connection is established
      // Since chat route is unconfirmed, just going back for demonstration,
      // or routing to a designated chat path if available.
      router.replace('/chat' as any);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F6E0FF', '#F9FBFF', '#D2ECFE']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.content}>
        <ActivityIndicator size="large" color={common.black} />
        <AppText variant="title1" emphasis="emphasized" textAlign="center" style={styles.title}>
          Connecting...
        </AppText>
        <AppText variant="body" color="muted" textAlign="center" style={styles.subtitle}>
          Please wait while we find the perfect match for you. You will be connected shortly.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.default,
  },
  gradient: {
    position: 'absolute',
    inset: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s6,
    gap: theme.spacing.s4,
  },
  title: {
    marginTop: theme.spacing.s4,
    color: theme.text.primary,
  },
  subtitle: {
    maxWidth: 300,
  },
}));
