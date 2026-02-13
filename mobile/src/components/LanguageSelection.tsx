import { AppText } from '@/components/AppText';
import { SmallButton } from '@/components/SmallButton';
import React, { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface LanguageSelectionProps {
  onLanguageChange?: (language: string, talkLanguages: string[]) => void;
}

/**
 * A comprehensive language selection component with app interface and talk language options.
 *
 * Includes two sections:
 * - App Interface Language: Single selection (English or Sinhala)
 * - Talk Languages: Multi-selection (Tamil, English, Sinhala)
 *
 * @component
 * @example
 * <LanguageSelection
 *   onLanguageChange={(language, talkLanguages) => {
 *     console.log('App Language:', language);
 *     console.log('Talk Languages:', talkLanguages);
 *   }}
 * />
 *
 * @param {function} [onLanguageChange] - Callback function called when any language selection changes
 * @param {string} onLanguageChange.language - Selected app interface language
 * @param {string[]} onLanguageChange.talkLanguages - Array of selected talk languages
 */
export const LanguageSelection = ({
  onLanguageChange,
}: LanguageSelectionProps) => {
  const [language, setLanguage] = useState('english');
  const [talkLanguages, setTalkLanguages] = useState(['english']);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    onLanguageChange?.(newLanguage, talkLanguages);
  };

  const handleTalkLanguagesChange = (newTalkLanguages: string[]) => {
    setTalkLanguages(newTalkLanguages);
    onLanguageChange?.(language, newTalkLanguages);
  };

  return (
    <View style={styles.container}>
      <View>
        <AppText variant="title3" emphasis="emphasized" color="primary">
          Choose your app language:
        </AppText>
        <AppText variant="subhead" emphasis="regular" color="primary">
          You can change this anytime...
        </AppText>
      </View>
      <View style={styles.interfaceCard}>
        <AppText variant="subhead" emphasis="emphasized" color="primary">
          App Interface Language
        </AppText>
        <View style={styles.selectionButtons}>
          <SmallButton
            selected={language === 'english'}
            onPress={() => handleLanguageChange('english')}
          >
            English
          </SmallButton>
          <SmallButton
            selected={language === 'sinhala'}
            onPress={() => handleLanguageChange('sinhala')}
          >
            Sinhala
          </SmallButton>
        </View>
      </View>
      <View style={styles.talkCard}>
        <AppText variant="subhead" emphasis="emphasized" color="primary">
          How would you like to talk with others?
        </AppText>
        <View style={styles.selectionButtons}>
          {['Tamil', 'English', 'Sinhala'].map(lang => {
            const isSelected = talkLanguages.includes(lang.toLowerCase());
            return (
              <SmallButton
                key={lang}
                selected={isSelected}
                onPress={() => {
                  const newTalkLanguages =
                    talkLanguages.includes(lang.toLowerCase()) ?
                      talkLanguages.filter(l => l !== lang.toLowerCase())
                    : [...talkLanguages, lang.toLowerCase()];
                  handleTalkLanguagesChange(newTalkLanguages);
                }}
              >
                {lang}
              </SmallButton>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create(theme => ({
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
}));
