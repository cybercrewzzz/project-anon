import { FullWidthButton } from '@/components/FullWidthButton';
import { GradientBackground } from '@/components/GradientBackground';
import { HeroImage } from '@/components/HeroImage';
import { LanguageSelection } from '@/components/LanguageSelection';
import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
//import { useRouter } from 'expo-router';

const SelectLanguage = () => {
  //const router = useRouter();

  return (
    <View style={styles.screen}>
      <GradientBackground />
      <HeroImage source={require('@/assets/images/hero.webp')} />
      <LanguageSelection />
      <FullWidthButton
      //onPress={() => router.navigate()}
      >
        Continue
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
    paddingTop: rt.insets.top + 32,
    paddingBottom: rt.insets.bottom,
    paddingHorizontal: 16,
  },
}));
