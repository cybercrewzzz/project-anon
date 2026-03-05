import { AppText } from '@/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

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
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <View style={styles.screen}>
      <View style={styles.baseLayer}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} style={styles.backIcon} />
          </Pressable>
        </View>
      </View>

      <View style={styles.overlay} />

      <View style={styles.sheet}>
        <AppText
          variant="title3"
          emphasis="emphasized"
          textAlign="center"
          style={styles.sheetTitle}
        >
          Select Your Issue
        </AppText>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search or Select Source"
            returnKeyType="search"
          />
          <Ionicons name="search" size={26} style={styles.searchIcon} />
        </View>

        <ScrollView
          style={styles.issueScroll}
          contentContainerStyle={styles.issueContent}
          showsVerticalScrollIndicator={false}
        >
          {issueGroups.map(group => (
            <View key={group.title} style={styles.issueCard}>
              <AppText variant="headline" emphasis="emphasized">
                {group.title}
              </AppText>

              <View style={styles.tagRow}>
                {group.tags.map(tag => (
                  <Pressable
                    key={`${group.title}-${tag}`}
                    style={styles.tagPill}
                  >
                    <AppText
                      variant="caption1"
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
            <Ionicons name="add" size={36} style={styles.otherIcon} />
            <AppText variant="headline" emphasis="emphasized">
              <AppText variant="headline" color="accent" emphasis="emphasized">
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
  backIcon: {
    color: theme.text.primary,
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
    height: '80%',
    backgroundColor: theme.surface.muted,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: theme.spacing.s4,
  },
  sheetTitle: {
    marginBottom: theme.spacing.s3,
  },
  searchBox: {
    marginHorizontal: theme.spacing.s4,
    marginBottom: theme.spacing.s3,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.surface.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: theme.spacing.s2,
  },
  searchInput: {
    flex: 1,
    color: theme.text.primary,
  },
  searchIcon: {
    color: theme.text.muted,
  },
  issueScroll: {
    flex: 1,
  },
  issueContent: {
    paddingHorizontal: theme.spacing.s4,
    paddingBottom: rt.insets.bottom + theme.spacing.s2,
    gap: theme.spacing.s5,
  },
  issueCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.s3,
    gap: theme.spacing.s3,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s2,
  },
  tagPill: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.action.secondary,
    paddingVertical: theme.spacing.s1,
    paddingHorizontal: theme.spacing.s3,
    minWidth: 100,
    alignItems: 'center',
  },
  otherCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: theme.spacing.s2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s1,
  },
  otherIcon: {
    color: theme.text.primary,
  },
}));
