import { AppText } from '@/components/AppText';
import { SmallButton } from '@/components/SmallButton';
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { Language } from '@/api/account';

interface LanguageSelectionProps {
  languages: Language[];
  onLanguageChange?: (interfaceLanguageId: string, talkLanguageIds: string[]) => void;
}

/**
 * A comprehensive language selection component with app interface and talk language options.
 */
export const LanguageSelection = ({
  languages,
  onLanguageChange,
}: LanguageSelectionProps) => {
  const defaultEnglish = languages.find(l => l.name.toLowerCase() === 'english');
  const initialLanguageId = defaultEnglish?.languageId || (languages[0]?.languageId ?? '');

  const [interfaceLanguageId, setInterfaceLanguageId] = useState<string>(initialLanguageId);
  const [talkLanguageIds, setTalkLanguageIds] = useState<string[]>(
    initialLanguageId ? [initialLanguageId] : [],
  );

  // Initialize defaults if languages load after mount
  useEffect(() => {
    if (!interfaceLanguageId && languages.length > 0) {
      const eng = languages.find(l => l.name.toLowerCase() === 'english');
      const fallbackId = eng?.languageId || languages[0].languageId;
      setInterfaceLanguageId(fallbackId);
      setTalkLanguageIds([fallbackId]);
      onLanguageChange?.(fallbackId, [fallbackId]);
    }
  }, [languages, interfaceLanguageId, onLanguageChange]);

  const handleLanguageChange = (id: string) => {
    setInterfaceLanguageId(id);
    onLanguageChange?.(id, talkLanguageIds);
  };

  const handleTalkLanguagesChange = (id: string) => {
    const isSelected = talkLanguageIds.includes(id);
    const newTalkLanguages =
      isSelected ?
        talkLanguageIds.filter(lId => lId !== id)
      : [...talkLanguageIds, id];
    setTalkLanguageIds(newTalkLanguages);
    onLanguageChange?.(interfaceLanguageId, newTalkLanguages);
  };

  // Restrict interface language choices to English & Sinhala per UI requirements,
  // or default to array slice if those are missing
  const interfaceLanguages = languages.filter(l => 
    ['english', 'sinhala'].includes(l.name.toLowerCase())
  );
  const interfaceChoices = interfaceLanguages.length > 0 ? interfaceLanguages : languages.slice(0, 2);

  // Talk languages allows Tamil, English, Sinhala (or first 3 if missing)
  const talkChoicesFiltered = languages.filter(l => 
    ['tamil', 'english', 'sinhala'].includes(l.name.toLowerCase())
  );
  const talkChoices = talkChoicesFiltered.length > 0 ? talkChoicesFiltered : languages.slice(0, 3);

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
          {interfaceChoices.map(lang => (
            <SmallButton
              key={lang.languageId}
              selected={interfaceLanguageId === lang.languageId}
              onPress={() => handleLanguageChange(lang.languageId)}
            >
              {lang.name}
            </SmallButton>
          ))}
        </View>
      </View>
      <View style={styles.talkCard}>
        <AppText variant="subhead" emphasis="emphasized" color="primary">
          How would you like to talk with others?
        </AppText>
        <View style={styles.selectionButtons}>
          {talkChoices.map(lang => {
            const isSelected = talkLanguageIds.includes(lang.languageId);
            return (
              <SmallButton
                key={lang.languageId}
                selected={isSelected}
                onPress={() => handleTalkLanguagesChange(lang.languageId)}
              >
                {lang.name}
              </SmallButton>
            );
          })}
        </View>
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
    gap: theme.spacing.s3 + theme.spacing.s1,
  },
}));
