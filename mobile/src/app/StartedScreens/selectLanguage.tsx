import { AppText } from '@/components/AppText';
import React, { useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const GradientColors = withUnistyles(LinearGradient, theme => ({
  colors: theme.gradient.backgroundPrimary,
}));

const SelectLanguage = () => {
  const bannerImage = require('mobile/assets/images/banners/startBanner.png');
  const router = useRouter();

  const [language, setLanguage] = useState('english');
  const [talkLanguages, setTalkLanguages] = useState(['english']);

  return (
    <View style={styles.screen}>
      <GradientColors style={styles.gradient} />
      <Image
        source={bannerImage}
        style={styles.imageCard}
        resizeMode="contain"
      />
      <View style={styles.container}>
        <View>
          <AppText variant="cardTitle">Choose your app language:</AppText>
          <AppText variant="body">You can change this anytime...</AppText>
        </View>
        <View style={styles.interfaceCard}>
          <AppText variant="listHeader">App Interface Language</AppText>
          <View style={styles.selectionButtons}>
            <Pressable
              style={
                language === 'english' ? styles.selected : styles.selection
              }
              onPress={() => setLanguage('english')}
            >
              <AppText color={language === 'english' ? 'secondary' : 'subtle1'}>
                English
              </AppText>
            </Pressable>
            <Pressable
              style={
                language === 'sinhala' ? styles.selected : styles.selection
              }
              onPress={() => setLanguage('sinhala')}
            >
              <AppText color={language === 'sinhala' ? 'secondary' : 'subtle1'}>
                Sinhala
              </AppText>
            </Pressable>
          </View>
        </View>
        <View style={styles.talkCard}>
          <AppText variant="listHeader">
            How would you like to talk with others?
          </AppText>
          <View style={styles.selectionButtons}>
            {['Tamil', 'English', 'Sinhala'].map(lang => {
              const isSelected = talkLanguages.includes(lang.toLowerCase());
              return (
                <Pressable
                  key={lang}
                  style={isSelected ? styles.selected : styles.selection}
                  onPress={() => {
                    setTalkLanguages(prev =>
                      prev.includes(lang.toLowerCase()) ?
                        prev.filter(l => l !== lang.toLowerCase())
                      : [...prev, lang.toLowerCase()],
                    );
                  }}
                >
                  <AppText color={isSelected ? 'secondary' : 'subtle1'}>
                    {lang}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      <Pressable
        style={styles.button}
        onPress={() => router.navigate('/StartedScreens/Temp')}
      >
        <AppText style={styles.buttonText}>Continue</AppText>
      </Pressable>
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
  gradient: {
    position: 'absolute',
    inset: 0,
  },
  imageCard: {
    width: '100%',
  },
  container: { gap: 32 },
  interfaceCard: {
    padding: 20,
    backgroundColor: theme.surface.primary,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  talkCard: {
    padding: 20,
    backgroundColor: theme.surface.primary,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  selected: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    backgroundColor: theme.action.primary,
    borderRadius: 9999,
  },
  selection: {
    paddingVertical: 4,
    paddingHorizontal: 18,
    borderRadius: 9999,
    borderColor: theme.action.primary,
    borderWidth: 2,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 64,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    alignSelf: 'stretch',
    backgroundColor: theme.action.secondary,
    borderRadius: 999,
  },
  buttonText: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: 600,
    color: theme.action.onPrimary,
  },
}));
