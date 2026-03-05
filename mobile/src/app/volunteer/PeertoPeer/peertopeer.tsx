import { AppText } from '@/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

const emojis = ['😔', '😕', '😐', '🙂', '😊'];

const issueGroups = [
  {
    title: 'Family Problems',
    tags: ['Anxiety', 'Stress', 'Depression'],
  },
  {
    title: 'Relationships',
    tags: ['Breakups', 'Stress', 'loneliness'],
  },
  {
    title: 'Friends / Social',
    tags: ['peer pressure', 'isolation', 'stress'],
  },
  {
    title: 'Education and Exam',
    tags: ['peer pressure', 'isolation', 'stress'],
  },
];

export default function VolunteerPeerToPeer() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.baseLayer}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} style={styles.backIcon} />
          </Pressable>
          <AppText variant="title2" emphasis="emphasized">
            Peer to Peer
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.badgesRow}>
          <View style={styles.starBadge}>
            <AppText variant="title3" color="secondary" emphasis="emphasized">
              ⭐ 185
            </AppText>
          </View>
          <View style={styles.ticketBadge}>
            <AppText variant="title3" color="accent" emphasis="emphasized">
              🎟️ 5
            </AppText>
          </View>
        </View>

        <View style={styles.moodCard}>
          <AppText variant="title2" color="accent" emphasis="emphasized">
            How are you feeling Right Now?
          </AppText>
          <View style={styles.emojiRow}>
            {emojis.map(item => (
              <AppText key={item} style={styles.emojiText}>
                {item}
              </AppText>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.overlay} />

      <View style={styles.sheet}>
        <AppText
          variant="title1"
          emphasis="emphasized"
          textAlign="center"
          style={styles.sheetTitle}
        >
          Select Your Issue
        </AppText>

        <View style={styles.searchBox}>
          <AppText variant="body" color="muted" style={styles.searchPlaceholder}>
            Search or Select Source
          </AppText>
          <Ionicons name="search" size={34} style={styles.searchIcon} />
        </View>

        <ScrollView
          style={styles.issueScroll}
          contentContainerStyle={styles.issueContent}
          showsVerticalScrollIndicator={false}
        >
          {issueGroups.map(group => (
            <View key={group.title} style={styles.issueCard}>
              <AppText variant="title1" emphasis="emphasized">
                {group.title}
              </AppText>

              <View style={styles.tagRow}>
                {group.tags.map(tag => (
                  <Pressable key={`${group.title}-${tag}`} style={styles.tagPill}>
                    <AppText
                      variant="headline"
                      color="secondary"
                      emphasis="emphasized"
                    >
                      {tag}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          <Pressable style={styles.otherCard}>
            <Ionicons name="add" size={48} style={styles.otherIcon} />
            <AppText variant="title1" emphasis="emphasized">
              <AppText variant="title1" color="accent" emphasis="emphasized">
                Other :
              </AppText>{' '}
              Tell Your Problem
            </AppText>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.background.default,
    paddingTop: rt.insets.top,
    position: 'relative',
  },
  baseLayer: {
    paddingHorizontal: theme.spacing.s5,
    gap: theme.spacing.s4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.s4,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: theme.text.primary,
  },
  headerSpacer: {
    width: 44,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.s3,
  },
  starBadge: {
    backgroundColor: theme.action.secondary,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s5,
  },
  ticketBadge: {
    borderWidth: 1,
    borderColor: theme.border.default,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s5,
    backgroundColor: theme.surface.primary,
  },
  moodCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.surface.primary,
    padding: theme.spacing.s5,
    gap: theme.spacing.s4,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 44,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.background.overlay,
    opacity: 0.2,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '74%',
    backgroundColor: theme.surface.muted,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    paddingTop: theme.spacing.s6,
  },
  sheetTitle: {
    marginBottom: theme.spacing.s4,
  },
  searchBox: {
    marginHorizontal: theme.spacing.s5,
    marginBottom: theme.spacing.s5,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.surface.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.s4,
    paddingVertical: theme.spacing.s3,
  },
  searchPlaceholder: {
    flex: 1,
  },
  searchIcon: {
    color: theme.text.muted,
  },
  issueScroll: {
    flex: 1,
  },
  issueContent: {
    paddingHorizontal: theme.spacing.s5,
    paddingBottom: rt.insets.bottom + theme.spacing.s4,
    gap: theme.spacing.s5,
  },
  issueCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.s4,
    gap: theme.spacing.s4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s3,
  },
  tagPill: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.action.secondary,
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    minWidth: 130,
    alignItems: 'center',
  },
  otherCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.s4,
    paddingVertical: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s2,
  },
  otherIcon: {
    color: theme.text.primary,
  },
}));