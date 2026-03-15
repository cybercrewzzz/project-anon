import { AppText } from '@/components/AppText';
import { View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '@/components/button';

const GradientColors = withUnistyles(LinearGradient, theme => ({
  colors: theme.gradient.backgroundPrimary,
}));

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <GradientColors style={styles.gradient} />

      {/* Top*/}
      <AppText
        variant="largeTitle"
        emphasis="emphasized"
        color="accent"
        style={styles.welcomeText}
      >
        Welcome !
      </AppText>

      {/* Image in between */}
      <Image
        source={require('@/assets/images/anoraLogo.png')}
        style={styles.logoImage}
        contentFit="contain"
      />

      {/* Bottom */}
      <View style={styles.bottom}>
        <Button
          text="Get Started"
          onPress={() => router.push('/start/user/selectLanguage' as any)}
        />

        <AppText style={styles.volunteerText}>Continue as a Volunteer</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: rt.insets.top + theme.spacing.s7,
    paddingBottom: rt.insets.bottom + theme.spacing.s7,
  },
  gradient: { position: 'absolute', inset: 0 },
  welcomeText: {
    textAlign: 'center',
    marginTop: theme.spacing.s6,
  },
  logoImage: {
    width: '100%',
    height: 300,
    marginHorizontal: theme.spacing.s4,
  },
  bottom: {
    alignItems: 'center',
    gap: theme.spacing.s5,
    alignSelf: 'stretch',
  },
  volunteerText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.text.primary,
    fontSize: 16,
  },
}));
