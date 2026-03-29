import { AppText } from '@/components/AppText';
import { SmallButton } from '@/components/SmallButton';
import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useQuery } from '@tanstack/react-query';
import { getLanguages } from '@/api/account';
import { parseApiError } from '@/api/errors';

interface LanguageSelectionProps {
  onLanguageChange?: (language: string, talkLanguages: string[]) => void;
}

/**
 * A comprehensive language selection component with app interface and talk language options.
 *
 * Includes two sections:
 * - App Interface Language: Single selection
 * - Talk Languages: Multi-selection
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
  const [talkLanguages, setTalkLanguages] = useState<string[]>(['english']);

  const {
    data: languages,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['languages'],
    queryFn: getLanguages,
  });

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    onLanguageChange?.(newLanguage, talkLanguages);
  };

  const handleTalkLanguagesChange = (newTalkLanguages: string[]) => {
    setTalkLanguages(newTalkLanguages);
    onLanguageChange?.(language, newTalkLanguages);
  };

  if (isError) {
    const apiError = parseApiError(error);
    return (
      <View style={styles.container}>
        <AppText variant="subhead" color="primary">
          Failed to load languages: {apiError.message}
        </AppText>
      </View>
    );
  }

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
        {isLoading ?
          <ActivityIndicator size="small" />
        : <View style={styles.selectionButtons}>
            {languages?.map((lang: { code: string; name: string }) => (
              <SmallButton
                key={`interface-${lang.code}`}
                selected={language === lang.code}
                onPress={() => handleLanguageChange(lang.code)}
              >
                {lang.name}
              </SmallButton>
            ))}
          </View>
        }
      </View>
      <View style={styles.talkCard}>
        <AppText variant="subhead" emphasis="emphasized" color="primary">
          How would you like to talk with others?
        </AppText>
        {isLoading ?
          <ActivityIndicator size="small" />
        : <View style={styles.selectionButtons}>
            {languages?.map((lang: { code: string; name: string }) => {
              const isSelected = talkLanguages.includes(lang.code);
              return (
                <SmallButton
                  key={`talk-${lang.code}`}
                  selected={isSelected}
                  onPress={() => {
                    const newTalkLanguages: string[] =
                      talkLanguages.includes(lang.code) ?
                        talkLanguages.filter((l: string) => l !== lang.code)
                      : [...talkLanguages, lang.code];
                    handleTalkLanguagesChange(newTalkLanguages);
                  }}
                >
                  {lang.name}
                </SmallButton>
              );
            })}
          </View>
        }
      </View>
    </View>
  );
};

const styles = StyleSheet.create(theme => ({
  container: { gap: theme.spacing.s6 },
  interfaceCard: {
    padding: theme.spacing.s4 + theme.spacing.s2,
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.mdSoft,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s3 + theme.spacing.s1,
  },
  talkCard: {
    padding: theme.spacing.s4 + theme.spacing.s2,
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.mdSoft,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s3 + theme.spacing.s1,
  },
  selectionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.s3 + theme.spacing.s1,
  },
}));
