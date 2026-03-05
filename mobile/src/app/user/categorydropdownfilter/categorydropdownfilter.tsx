import { AppText } from '@/components/AppText';
import { common } from '@/theme/palettes/common';
import { purple } from '@/theme/palettes/purple';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

const emojis = ['😖', '😔', '😐', '😊', '😇'];

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

export default function CategoryDropdownFilter() {
  const router = useRouter();
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [categoryText, setCategoryText] = useState('Family stress');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Anxious',
    'Angry',
    'Scared',
    'Overwhelmed',
  ]);

  const selectedTagSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={common.black} />
          </Pressable>
          <AppText variant="title3" emphasis="emphasized">
            Peer to Peer
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.starBadge}>
            <AppText style={styles.starBadgeText}>⭐ 185</AppText>
          </View>
          <View style={styles.ticketBadge}>
            <AppText style={styles.ticketBadgeText}>🎫 5</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText variant="body" emphasis="emphasized" color="accent">
            How are you feeling Right Now?
          </AppText>
          <View style={styles.emojiRow}>
            {emojis.map((emoji, index) => (
              <Pressable
                key={emoji}
                style={[
                  styles.emojiBtn,
                  selectedEmoji === index && styles.emojiBtnSelected,
                ]}
                onPress={() => setSelectedEmoji(index)}
              >
                <AppText style={styles.emoji}>{emoji}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

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
            placeholder="Family stress"
            placeholderTextColor={common.gray[400]}
          />
        </View>

        <View style={styles.filterCard}>
          <AppText variant="title3" emphasis="emphasized" style={styles.filterTitle}>
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
                    style={selected ? styles.tagTextSelected : styles.tagTextDefault}
                  >
                    {tag}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable style={styles.okBtn}>
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
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.s4,
    paddingBottom: theme.spacing.s7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.s4,
    marginBottom: theme.spacing.s2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.s3,
    marginBottom: theme.spacing.s4,
  },
  starBadge: {
    backgroundColor: purple[500],
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadgeText: {
    color: common.white,
    fontWeight: '600',
    fontSize: 14,
  },
  ticketBadge: {
    borderWidth: 1.5,
    borderColor: common.gray[300],
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface.primary,
  },
  ticketBadgeText: {
    color: common.gray[700],
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.s4,
    marginBottom: theme.spacing.s4,
    gap: theme.spacing.s4,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emojiBtn: {
    padding: theme.spacing.s4,
    borderRadius: theme.radius.full,
  },
  emojiBtnSelected: {
    backgroundColor: theme.border.default,
  },
  emoji: {
    fontSize: 30,
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
    height: '74%',
    backgroundColor: theme.surface.muted,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: theme.spacing.s5,
    paddingHorizontal: theme.spacing.s4,
    paddingBottom: rt.insets.bottom + theme.spacing.s4,
  },
  sheetTitle: {
    marginBottom: theme.spacing.s4,
  },
  categoryInputRow: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: theme.spacing.s2,
    gap: theme.spacing.s2,
    marginBottom: theme.spacing.s5,
  },
  categoryInput: {
    flex: 1,
    color: theme.text.primary,
  },
  filterCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.s4,
    gap: theme.spacing.s3,
  },
  filterTitle: {
    marginBottom: theme.spacing.s1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s2,
  },
  tagPill: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.surface.primary,
    borderWidth: 1,
    borderColor: common.gray[300],
    paddingVertical: theme.spacing.s1,
    paddingHorizontal: theme.spacing.s3,
    minHeight: 30,
    justifyContent: 'center',
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
