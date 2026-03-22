import { AppText } from '@/components/AppText';
import { common } from '@/theme/palettes/common';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

const feelingTags = [
  'Anxious',
  'Angry',
  'Scared',
  'Overwhelmed',
  'Ashamed',
  'Disgusted',
  'Frustrated',
  'Depression',
  'Worried',
  'loneliness',
  'pressure',
  'Discouraged',
  'Sad',
  'Drained',
  'Breakups',
  'Stress',
];

export default function CategoryDropOther() {
  const router = useRouter();
  const [categoryText, setCategoryText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Anxious',
    'Angry',
    'Scared',
    'Overwhelmed',
  ]);

  const selectedTagSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.baseLayer}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={common.black} />
          </Pressable>
        </View>
      </View>

      <View style={styles.overlay} />

      <View style={styles.sheet}>
        <AppText
          variant="title2"
          emphasis="emphasized"
          textAlign="center"
          style={styles.sheetTitle}
        >
          Select Your Issue
        </AppText>

        <View style={styles.categoryInputRow}>
          <Ionicons name="add" size={24} color={common.gray[700]} />
          <TextInput
            style={styles.categoryInput}
            value={categoryText}
            onChangeText={setCategoryText}
            placeholder="Tell us about your issues"
            placeholderTextColor={common.gray[400]}
            multiline
            numberOfLines={5}
          />
        </View>

        <View style={styles.filterCard}>
          <AppText
            variant="title3"
            emphasis="emphasized"
            style={styles.filterTitle}
          >
            What best describes this feeling?
          </AppText>

          <View style={styles.tagRow}>
            {feelingTags.map(tag => {
              const selected = selectedTagSet.has(tag);

              return (
                <Pressable
                  key={tag}
                  style={[styles.tagPill, selected && styles.tagPillSelected]}
                  onPress={() => toggleTag(tag)}
                >
                  <AppText
                    variant="caption1"
                    emphasis="emphasized"
                    style={
                      selected ? styles.tagTextSelected : styles.tagTextDefault
                    }
                  >
                    {tag}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          style={styles.okBtn}
          onPress={() =>
            router.push('/user/p2p-p2v-withCategory/P2P-P2V-withCategory')
          }
        >
          <AppText variant="title2" emphasis="emphasized" color="secondary">
            OK
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.default,
    paddingTop: rt.insets.top,
    position: 'relative',
  },
  baseLayer: {
    paddingHorizontal: theme.spacing.s4,
    gap: theme.spacing.s2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: theme.spacing.s2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: common.black,
    opacity: 0.2,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '78%',
    backgroundColor: theme.surface.muted,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: theme.spacing.s5,
    paddingHorizontal: theme.spacing.s4,
    paddingBottom: rt.insets.bottom + theme.spacing.s4,
  },
  sheetTitle: {
    marginBottom: theme.spacing.s3,
  },
  categoryInputRow: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: theme.spacing.s2,
    gap: theme.spacing.s2,
    marginBottom: theme.spacing.s4,
    minHeight: 144,
  },
  categoryInput: {
    flex: 1,
    color: theme.text.primary,
    minHeight: 120,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  filterCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.s5,
    paddingVertical: theme.spacing.s5,
    gap: theme.spacing.s4,
    minHeight: 320,
  },
  filterTitle: {
    marginBottom: theme.spacing.s2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.s3,
    columnGap: theme.spacing.s2,
  },
  tagPill: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.surface.primary,
    borderWidth: 1,
    borderColor: common.gray[300],
    minWidth: '45%',
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.s2,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagPillSelected: {
    backgroundColor: theme.action.secondary,
    borderColor: theme.action.secondary,
  },
  tagTextDefault: {
    color: theme.text.accent,
  },
  tagTextSelected: {
    color: theme.text.secondary,
  },
  okBtn: {
    marginTop: 'auto',
    alignSelf: 'center',
    minWidth: 120,
    borderRadius: theme.radius.full,
    backgroundColor: theme.action.secondary,
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
