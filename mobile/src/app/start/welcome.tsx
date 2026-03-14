import { AppText } from '@/components/AppText';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import React from 'react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

export default function Welcome() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      {/* Top*/}
      <AppText
        variant="largeTitle"
        emphasis="emphasized"
        style={styles.welcomeText}
      >
        Welcome!
      </AppText>

      {/* Image in between */}
      <Image
        source={require('@/assets/images/hero.webp')}
        style={{ width: 100, height: 100 }}
      />

      {/* Bottom */}
      <View style={styles.bottom}>
        <Pressable 
          style={styles.button}
          onPress={() => router.push('/start/selectLanguage' as any)}
        >
          <AppText style={styles.buttonText}>Get Started</AppText>
        </Pressable>

        <AppText style={styles.volunteerText}>Continue as a Volunteer</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: '#D2ECFE',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: rt.insets.top + 40,
    paddingBottom: 80,
  },
  welcomeText: {
    fontSize: 32,
    color: theme.text.accent,
    textAlign: 'center',
    lineHeight: 40,
  },
  bottom: {
    alignItems: 'center',
    gap: theme.spacing.s5,
  },
  button: {
    backgroundColor: theme.background.accent,
    padding: 12,
    borderRadius: theme.radius.xl,
    width: 300,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.text.secondary,
    fontWeight: 'bold',
  },
  volunteerText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.text.accent,
  },
}));
