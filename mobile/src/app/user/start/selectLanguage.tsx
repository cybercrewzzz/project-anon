import { AppText } from '@/components/AppText';
import { FullWidthButton } from '@/components/FullWidthButton';
import { HeroImage } from '@/components/HeroImage';
import { LanguageSelection } from '@/components/LanguageSelection';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
//import { useRouter } from 'expo-router';
import { useRouter } from 'expo-router';

const GradientColors = withUnistyles(LinearGradient, theme => ({
  colors: theme.gradient.backgroundPrimary,
}));

const SelectLanguage = () => {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <GradientColors style={styles.gradient} />
      <HeroImage source={require('@/assets/images/hero.webp')} />
      <LanguageSelection />
      <FullWidthButton onPress={() => router.push('/user/start/authScreens/signIn' as any)}>
        <AppText variant="headline" color="secondary">
          Continue
        </AppText>
      </FullWidthButton>
    </View>
  );
};

export default SelectLanguage;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: rt.insets.top + theme.spacing.s6,
    paddingBottom: rt.insets.bottom + theme.spacing.s8,
    paddingHorizontal: theme.spacing.s4,
  },
  gradient: { position: 'absolute', inset: 0 },
}));
