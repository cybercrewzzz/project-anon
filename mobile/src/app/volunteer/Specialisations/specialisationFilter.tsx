import { AppText } from '@/components/AppText';
import { common } from '@/theme/palettes/common';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

// =============================================================================
// ENDPOINT: GET /lookup/specialisations
// Hook: useSpecialisations — loads the list of selectable tags from the API
// Replaces the hardcoded feelingTags array with real data
// =============================================================================
import { useSpecialisations } from '@/hooks/useLookup';

export default function SpecialisationFilter() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  // ── GET /lookup/specialisations ─────────────────────────────────────────────
  // Replaces the hardcoded feelingTags array
  const {
    data: specialisations,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useSpecialisations();

  // Tracks selected UUIDs — kept as local state for now
  // When PATCH /volunteer/profile screen is built, selectedIds will be passed
  // to useUpdateVolunteerProfile({ specialisationIds: selectedIds })
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleTag = (specialisationId: string) => {
    setSelectedIds(prev =>
      prev.includes(specialisationId) ?
        prev.filter(id => id !== specialisationId)
      : [...prev, specialisationId],
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F0E7FF', '#F9FBFF', '#BCDCF0']}
        style={styles.gradient}
        start={{ x: 0.05, y: 0.2 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0.2, 0.5, 1]}
      />
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
          Select your specialisation
        </AppText>

        <View style={styles.categoryInputRow}>
          <Ionicons name="add" size={24} color={common.gray[700]} />
          <TextInput
            style={styles.categoryInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search specialisations..."
            placeholderTextColor={common.gray[400]}
          />
        </View>

        <View style={styles.filterCard}>
          {/* ── GET /lookup/specialisations ── */}
          {/* Shows spinner while loading, then renders real tags from API */}
          {isLoading ?
            <ActivityIndicator size="small" />
          : isError ?
            <View style={{ alignItems: 'center', padding: 16 }}>
              <AppText variant="body" emphasis="emphasized" textAlign="center">
                Could not load specialisations. Please try again.
              </AppText>
              {isFetching ? (
                <ActivityIndicator size="small" style={{ marginTop: 16 }} />
              ) : (
                <Pressable
                  onPress={() => refetch()}
                  disabled={isFetching}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    marginTop: 16,
                    opacity: isFetching ? 0.5 : 1,
                  }}
                >
                  <AppText variant="body" emphasis="emphasized" color="accent">
                    Retry
                  </AppText>
                </Pressable>
              )}
            </View>
          : <View style={styles.tagRow}>
              {(specialisations ?? []).map(spec => {
                const selected = selectedIdSet.has(spec.specialisationId);
                return (
                  <Pressable
                    key={spec.specialisationId}
                    style={[styles.tagPill, selected && styles.tagPillSelected]}
                    onPress={() => toggleTag(spec.specialisationId)}
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
                      {spec.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          }
        </View>

        {/* OK — just navigates back for now                              */}
        {/* TODO: wire to PATCH /volunteer/profile when screen is built   */}
        <Pressable
          style={[styles.okBtnWrapper, isLoading && { opacity: 0.5 }]}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#1D47DC', '#0E7FBC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.okBtn}
          >
            <AppText
              variant="title2"
              emphasis="emphasized"
              style={styles.okBtnText}
            >
              OK
            </AppText>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// Styles unchanged from original
const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    paddingTop: rt.insets.top,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    inset: 0,
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
    backgroundColor: common.white,
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
    borderWidth: 1,
    borderColor: common.gray[300],
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
    rowGap: theme.spacing.s4,
    columnGap: theme.spacing.s3,
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
    backgroundColor: '#0E7FBC',
    borderColor: '#0E7FBC',
  },
  tagTextDefault: {
    color: theme.text.accent,
  },
  tagTextSelected: {
    color: common.white,
  },
  okBtnWrapper: {
    marginTop: 'auto',
    alignSelf: 'center',
    minWidth: 120,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  okBtn: {
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okBtnText: {
    color: common.white,
  },
}));
