import { AppText } from '@/components/AppText';
import { common } from '@/theme/palettes/common';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

// =============================================================================
// ENDPOINT: GET /lookup/categories
// SCREEN:   src/app/user/categorydropdownfilter/
// ACCESS:   Any authenticated user (JwtAuthGuard only, no RolesGuard)
// PURPOSE:  Loads all problem categories to display as selectable tags
//
// HOW TO TEST:
//   → Set USE_MOCK = true in src/hooks/useLookup.ts
//   → Open this screen — tags should load from MOCK_CATEGORIES
//   → Toggle tags and verify selectedIds updates
//   → Set USE_MOCK = false when backend is running
// =============================================================================
import { useCategories } from '@/hooks/useLookup';

export default function CategoryDropdownFilter() {
  const router = useRouter();
  const [categoryText, setCategoryText] = useState('Family stress');

  // ── GET /lookup/categories ──────────────────────────────────────────────────
  // Replaces the hardcoded feelingTags array with real data from the API
  const {
    data: categories,
    isLoading,
    isError,
    refetch,
  } = useCategories();

  // Tracks selected UUIDs — categoryId instead of name strings
  // TODO: wire selectedIds to the seeker problem creation flow when built
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleTag = (categoryId: string) => {
    setSelectedIds(prev =>
      prev.includes(categoryId) ?
        prev.filter(id => id !== categoryId)
      : [...prev, categoryId],
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
            placeholder="Family stress"
            placeholderTextColor={common.gray[400]}
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

          {/* ── GET /lookup/categories ── */}
          {/* Shows spinner while loading, then renders real tags from API */}
          {isLoading ?
            <ActivityIndicator size="small" />
          : isError ?
            <View style={styles.errorContainer}>
              <AppText
                variant="body"
                emphasis="emphasized"
                style={styles.errorText}
              >
                Unable to load categories. Please try again.
              </AppText>
              <Pressable style={styles.retryBtn} onPress={() => refetch()}>
                <AppText variant="caption1" emphasis="emphasized" color="secondary">
                  Retry
                </AppText>
              </Pressable>
            </View>
          : <View style={styles.tagRow}>
              {(categories ?? []).map(category => {
                const selected = selectedIdSet.has(category.categoryId);
                return (
                  <Pressable
                    key={category.categoryId}
                    style={[styles.tagPill, selected && styles.tagPillSelected]}
                    onPress={() => toggleTag(category.categoryId)}
                  >
                    <AppText
                      variant="caption1"
                      emphasis="emphasized"
                      style={
                        selected ?
                          styles.tagTextSelected
                        : styles.tagTextDefault
                      }
                    >
                      {category.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          }
        </View>

        {/* OK — just navigates back for now                                    */}
        {/* TODO: wire to problem creation endpoint when seeker flow is built   */}
        <Pressable style={styles.okBtn} onPress={() => router.back()}>
          <AppText variant="title2" emphasis="emphasized" color="secondary">
            OK
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

// Styles unchanged from original
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
    height: '74%',
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
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: theme.spacing.s2,
    gap: theme.spacing.s2,
    marginBottom: theme.spacing.s4,
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
  errorContainer: {
    alignItems: 'center',
    gap: theme.spacing.s2,
  },
  errorText: {
    color: theme.state.error || theme.text.primary,
    textAlign: 'center',
  },
  retryBtn: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.action.secondary,
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    alignItems: 'center',
    justifyContent: 'center',
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
