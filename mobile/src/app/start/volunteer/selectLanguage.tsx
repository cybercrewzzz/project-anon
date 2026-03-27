import { AppText } from '@/components/AppText';
import { FullWidthButton } from '@/components/FullWidthButton';
import { HeroImage } from '@/components/HeroImage';
import { LanguageSelection } from '@/components/LanguageSelection';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getLanguages } from '@/api/account';

const GradientColors = withUnistyles(LinearGradient, theme => ({
  colors: theme.gradient.backgroundPrimary,
}));

const SelectLanguage = () => {
  const router = useRouter();

  const [interfaceLanguageId, setInterfaceLanguageId] = useState<string | null>(null);
  const [languageIds, setLanguageIds] = useState<string[]>([]);

  // Fetch available languages
  const { data: languages, isLoading, isError } = useQuery({
    queryKey: ['languages'],
    queryFn: getLanguages,
  });

  return (
    <View style={styles.screen}>
      <GradientColors style={styles.gradient} />
      <HeroImage source={require('@/assets/images/hero.webp')} />
      
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <AppText style={{ marginTop: 16 }}>Loading languages...</AppText>
        </View>
      ) : isError || !languages ? (
        <View style={styles.centerContainer}>
          <AppText color="accent">Failed to load languages.</AppText>
        </View>
      ) : (
        <LanguageSelection 
          languages={languages}
          onLanguageChange={(interId, talkIds) => {
            setInterfaceLanguageId(interId);
            setLanguageIds(talkIds);
          }}
        />
      )}

      <FullWidthButton
        onPress={() =>
          router.push('/start/volunteer/authScreens/signupNlogin' as any)
        }
        disabled={isLoading || isError || !languages}
      >
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
