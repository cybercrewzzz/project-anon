import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { AppText } from '@/components/AppText';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/api/keys';
import { fetchSessionTickets, connectSession } from '@/api/session-api';
import { ApiError } from '@/api/errors';
import { useCategories } from '@/hooks/useLookup';
import type { Category } from '@/api/schemas/common';
import * as Crypto from 'expo-crypto';

// ── Themed gradient wrappers ──────────────────────────────────────────────────
const HistoryBarGradient = withUnistyles(LinearGradient, theme => ({
  colors: theme.gradient.backgroundSecondary,
}));

const ConnectButtonGradient = withUnistyles(LinearGradient, theme => ({
  colors: theme.gradient.textGradient,
}));

// ── Feeling level emoji map (1=worst → 5=best) ───────────────────────────────
const FEELING_EMOJIS = [
  { level: 1, icon: require('@/assets/icons/face-em1.svg') },
  { level: 2, icon: require('@/assets/icons/face-em2.svg') },
  { level: 3, icon: require('@/assets/icons/face-em3.svg') },
  { level: 4, icon: require('@/assets/icons/face-em4.svg') },
  { level: 5, icon: require('@/assets/icons/face-em5.svg') },
];

// =============================================================================
// UNIFIED CONNECT SCREEN
// Consolidates: peertopeer, categorydrop1, P2P-P2V-withCategory,
//               categorydropdownfilter, categorydropother
// =============================================================================

export default function ConnectScreen() {
  const router = useRouter();

  // ── Core state ────────────────────────────────────────────────────────────
  const [feelingLevel, setFeelingLevel] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [problemText, setProblemText] = useState('');
  const [sameGender, setSameGender] = useState(false);
  const [volunteerOnly, setVolunteerOnly] = useState(true);

  // ── Popup visibility state ────────────────────────────────────────────────
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showTagPopup, setShowTagPopup] = useState(false);
  const [showOtherPopup, setShowOtherPopup] = useState(false);
  const [showConnectingPopup, setShowConnectingPopup] = useState(false);
  const [connectingState, setConnectingState] = useState<
    'searching' | 'connected'
  >('searching');
  const [categorySearch, setCategorySearch] = useState('');

  // ── API data ──────────────────────────────────────────────────────────────
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: queryKeys.tickets,
    queryFn: fetchSessionTickets,
    staleTime: 30_000,
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  // ── Derived values ────────────────────────────────────────────────────────
  const selectedCategory = categories?.find(
    c => c.categoryId === selectedCategoryId,
  );
  const hasCategory = selectedCategoryId !== null;
  const ticketCount =
    ticketsLoading ? '...' : (tickets?.remaining ?? 0).toString();

  // Selected tag category objects for display
  const selectedTags = (categories ?? []).filter(c =>
    selectedTagIds.includes(c.categoryId),
  );

  // ── Connect mutation ──────────────────────────────────────────────────────
  const connectMutation = useMutation({
    mutationFn: connectSession,
    onSuccess: result => {
      if ('status' in result && result.status === 'waiting') {
        router.push({
          pathname: '/user/WaitingScreen/waitingScreen',
          params: { sessionId: result.sessionId },
        });
      } else if ('sessionId' in result && 'volunteerId' in result) {
        router.push({
          pathname: '/user/session/[chat]',
          params: { chat: result.sessionId },
        });
      }
    },
    onError: (error: unknown) => {
      setShowConnectingPopup(false);
      if (error instanceof ApiError) {
        if (error.statusCode === 403) {
          Alert.alert(
            'No Tickets Left',
            'You have used all your sessions for today. Please try again tomorrow.',
          );
        } else if (error.statusCode === 409) {
          Alert.alert(
            'Active Session',
            'You already have an active session. Please end it before starting a new one.',
          );
        } else {
          Alert.alert('Connection Failed', error.message);
        }
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    },
  });

  const handleConnect = () => {
    if (!selectedCategoryId) {
      Alert.alert('Select a Category', 'Please choose what is troubling you.');
      return;
    }
    if (!feelingLevel) {
      Alert.alert('How are you feeling?', 'Please select your feeling level.');
      return;
    }
    if (!ticketsLoading && tickets && tickets.remaining === 0) {
      Alert.alert(
        'No Tickets Left',
        'You have used all your sessions for today.',
      );
      return;
    }
    // Show connecting popup — actual API call happens after animation
    setConnectingState('searching');
    setShowConnectingPopup(true);
  };

  // ── Tag helpers ───────────────────────────────────────────────────────────
  const toggleTag = (categoryId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const removeTag = (categoryId: string) => {
    setSelectedTagIds(prev => prev.filter(id => id !== categoryId));
  };

  // ── Category selection handler ────────────────────────────────────────────
  const handleSelectCategory = (category: Category) => {
    setSelectedCategoryId(category.categoryId);
    setShowCategoryPopup(false);
    // Auto-add the selected category as a tag if not already
    if (!selectedTagIds.includes(category.categoryId)) {
      setSelectedTagIds(prev => [...prev, category.categoryId]);
    }
  };

  const handleSelectOther = () => {
    setShowCategoryPopup(false);
    setShowOtherPopup(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.screenTitle}>
          <AppText variant="headline">Peer to Peer</AppText>
        </View>

        {/* ── Badge Row ───────────────────────────────────────────── */}
        <View style={styles.badgeRow}>
          <View style={styles.pointBadge}>
            <Image
              source={require('@/assets/icons/pointsStar.svg')}
              style={styles.badgeIcon}
            />
            <AppText
              variant="body"
              emphasis="emphasized"
              style={styles.pointBadgeText}
            >
              185
            </AppText>
          </View>

          <View style={styles.ticketBadge}>
            <Image
              source={require('@/assets/icons/ticket.svg')}
              style={styles.badgeIcon}
            />
            <AppText
              variant="body"
              emphasis="emphasized"
              style={styles.ticketBadgeText}
            >
              {ticketCount}
            </AppText>
          </View>
        </View>

        {/* ── Mood Card ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <AppText
            variant="body"
            emphasis="emphasized"
            style={styles.cardTitle}
          >
            How are you feeling Right Now?
          </AppText>
          <View style={styles.emojiRow}>
            {FEELING_EMOJIS.map(({ level, icon }) => (
              <Pressable
                key={level}
                onPress={() => setFeelingLevel(level)}
                style={[
                  styles.emojiWrapper,
                  feelingLevel === level && styles.emojiWrapperSelected,
                ]}
              >
                <Image source={icon} style={styles.emojiIcon} />
              </Pressable>
            ))}
          </View>
          {feelingLevel && (
            <AppText variant="caption1" style={styles.feelingLabel}>
              Feeling level: {feelingLevel}/5
            </AppText>
          )}
        </View>

        {/* ── Category Card ───────────────────────────────────────── */}
        <View style={styles.card}>
          <AppText
            variant="body"
            emphasis="emphasized"
            style={styles.cardTitle}
          >
            What&apos;s troubling you today?
          </AppText>

          {/* Category Dropdown */}
          <Pressable
            style={styles.categoryDropdown}
            onPress={() => setShowCategoryPopup(true)}
          >
            <AppText
              variant="body"
              emphasis="emphasized"
              style={styles.categoryDropdownText}
            >
              {categoriesLoading
                ? 'Loading…'
                : selectedCategory
                  ? selectedCategory.name
                  : selectedCategoryId === 'other'
                    ? 'Other'
                    : 'Select a Category'}
            </AppText>
            <Image
              source={require('@/assets/icons/chevron-downOPT.svg')}
              style={styles.dropdownChevron}
            />
          </Pressable>

          {/* ── Conditional: Tags + Problem Text (shown after category selected) ── */}
          {hasCategory && (
            <>
              {/* What Best Describes this Feeling? */}
              <View style={styles.tagsSection}>
                <View style={styles.tagsSectionHeader}>
                  <AppText
                    variant="body"
                    emphasis="emphasized"
                    style={styles.cardTitle}
                  >
                    What Best Describes this Feeling?
                  </AppText>
                  <Pressable
                    style={styles.addTagButton}
                    onPress={() => setShowTagPopup(true)}
                  >
                    <Image
                      source={require('@/assets/icons/plusIconOPT.svg')}
                      style={styles.plusIcon}
                    />
                  </Pressable>
                </View>
                <View style={styles.tagRow}>
                  {selectedTags.map(tag => (
                    <Pressable
                      key={tag.categoryId}
                      style={styles.tagPillSelected}
                      onPress={() => removeTag(tag.categoryId)}
                    >
                      <AppText
                        variant="caption1"
                        emphasis="emphasized"
                        style={styles.tagTextSelected}
                      >
                        {tag.name} ✕
                      </AppText>
                    </Pressable>
                  ))}
                  {selectedTags.length === 0 && (
                    <AppText variant="caption1" style={styles.tagPlaceholder}>
                      Tap + to add feelings
                    </AppText>
                  )}
                </View>
              </View>

              {/* Tell Your Problem */}
              <View>
                <AppText
                  variant="body"
                  emphasis="emphasized"
                  style={styles.cardTitle}
                >
                  Tell Your Problem
                </AppText>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Tell us about your issue (optional)"
                    placeholderTextColor="#A56FFF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={problemText}
                    onChangeText={setProblemText}
                  />
                </View>
              </View>
            </>
          )}

          {/* Toggles */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleItem}>
              <AppText variant="caption1" style={styles.toggleLabel}>
                Same-Gender
              </AppText>
              <Switch
                value={sameGender}
                onValueChange={setSameGender}
                trackColor={{ false: '#D1D5DB', true: '#9500FF' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.toggleItem}>
              <AppText variant="caption1" style={styles.toggleLabel}>
                Volunteer Only
              </AppText>
              <Switch
                value={volunteerOnly}
                onValueChange={setVolunteerOnly}
                trackColor={{ false: '#D1D5DB', true: '#9500FF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Connect Button */}
          <Pressable
            onPress={handleConnect}
            disabled={connectMutation.isPending}
            style={styles.connectButtonWrapper}
          >
            <ConnectButtonGradient
              style={[
                styles.connectButton,
                connectMutation.isPending && styles.connectButtonDisabled,
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            >
              {connectMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <AppText variant="body" emphasis="emphasized" color="secondary">
                  Connect
                </AppText>
              )}
            </ConnectButtonGradient>
          </Pressable>

          <AppText variant="caption1" style={styles.anonymousText}>
            Your match will remain anonymous!
          </AppText>
        </View>

        {/* ── Connection History Bar ───────────────────────────────── */}
        <View style={styles.historyBarContainer}>
          <Pressable
            disabled={true}
            onPress={() => {
              Alert.alert(
                'Coming Soon',
                'Session history feature coming soon!',
              );
            }}
          >
            <HistoryBarGradient
              style={[styles.historyBar, { opacity: 0.6 }]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            >
              <AppText
                variant="body"
                emphasis="emphasized"
                style={styles.historyBarText}
              >
                Connection History
              </AppText>
              <Image
                source={require('@/assets/icons/chevronRightOPT.svg')}
                style={styles.historyChevron}
              />
            </HistoryBarGradient>
          </Pressable>
        </View>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════════
          POPUP 1: Category Selection Bottom Sheet
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showCategoryPopup}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryPopup(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCategoryPopup(false)}
        >
          <Pressable
            style={styles.categorySheet}
            onPress={e => e.stopPropagation()}
          >
            <AppText
              variant="title3"
              emphasis="emphasized"
              textAlign="center"
              style={styles.sheetTitle}
            >
              Select Your Issue
            </AppText>

            {/* Search Bar */}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder="Search or Select Source"
                placeholderTextColor="#B8B8B8"
                returnKeyType="search"
              />
              <Image
                source={require('@/assets/icons/chevron-downOPT.svg')}
                style={styles.searchIcon}
              />
            </View>

            {/* Category List */}
            <ScrollView
              style={styles.categoryList}
              contentContainerStyle={styles.categoryListContent}
              showsVerticalScrollIndicator={false}
            >
              {categoriesLoading ? (
                <ActivityIndicator
                  size="large"
                  style={{ marginTop: 40 }}
                />
              ) : categoriesError ? (
                <View style={styles.categoryErrorContainer}>
                  <AppText
                    variant="body"
                    emphasis="emphasized"
                    textAlign="center"
                  >
                    Could not load categories.
                  </AppText>
                  <Pressable
                    style={styles.retryButton}
                    onPress={() => refetchCategories()}
                  >
                    <AppText
                      variant="body"
                      emphasis="emphasized"
                      color="secondary"
                    >
                      Retry
                    </AppText>
                  </Pressable>
                </View>
              ) : (
                <>
                  {(categories ?? [])
                    .filter(cat =>
                      categorySearch.trim() === ''
                        ? true
                        : cat.name
                            .toLowerCase()
                            .includes(categorySearch.toLowerCase()),
                    )
                    .map(cat => (
                      <Pressable
                        key={cat.categoryId}
                        style={styles.categoryCard}
                        onPress={() => handleSelectCategory(cat)}
                      >
                        <AppText variant="headline" emphasis="emphasized">
                          {cat.name}
                        </AppText>
                        {cat.description && (
                          <AppText
                            variant="caption1"
                            style={styles.categoryDescription}
                          >
                            {cat.description}
                          </AppText>
                        )}
                      </Pressable>
                    ))}

                  {/* "Other: Tell Your Problem" option */}
                  <Pressable
                    style={styles.otherCard}
                    onPress={handleSelectOther}
                  >
                    <Image
                      source={require('@/assets/icons/plusIconOPT.svg')}
                      style={styles.otherPlusIcon}
                    />
                    <AppText variant="headline" emphasis="emphasized">
                      <AppText
                        variant="headline"
                        color="accent"
                        emphasis="emphasized"
                      >
                        Other :
                      </AppText>{' '}
                      Tell Your Problem
                    </AppText>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          POPUPS 2-4 — added in Steps 4-6
         ══════════════════════════════════════════════════════════════════════ */}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.surface.secondary,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // ── Header ──
  screenTitle: {
    alignItems: 'center',
    marginTop: 20,
  },

  // ── Badge Row ──
  badgeRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  pointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  badgeIcon: {
    width: 25,
    height: 25,
  },
  pointBadgeText: {
    color: theme.text.secondary,
  },
  ticketBadgeText: {
    color: theme.text.accent,
    paddingHorizontal: 5,
  },

  // ── Card (shared) ──
  card: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s4,
    marginTop: 20,
    gap: theme.spacing.s3,
  },
  cardTitle: {
    color: theme.text.subtle1,
    marginVertical: 4,
  },

  // ── Emoji / Mood ──
  emojiRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 24,
    padding: 4,
    justifyContent: 'center',
  },
  emojiWrapper: {
    padding: 4,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiWrapperSelected: {
    borderColor: theme.background.accent,
    backgroundColor: theme.background.accent + '20',
  },
  emojiIcon: {
    width: 35,
    height: 35,
  },
  feelingLabel: {
    color: theme.text.muted,
    textAlign: 'center',
    marginTop: 6,
  },

  // ── Category Dropdown ──
  categoryDropdown: {
    flexDirection: 'row',
    backgroundColor: theme.surface.secondary,
    borderColor: theme.text.subtle2,
    borderWidth: 2,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  categoryDropdownText: {
    color: theme.text.primary,
    paddingVertical: 8,
    paddingHorizontal: 4,
    flex: 1,
  },
  dropdownChevron: {
    width: 16,
    height: 14,
    alignSelf: 'center',
    marginRight: 8,
  },

  // ── Tags Section ──
  tagsSection: {
    gap: theme.spacing.s2,
  },
  tagsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addTagButton: {
    padding: theme.spacing.s2,
    backgroundColor: theme.surface.secondary,
    borderRadius: theme.radius.full,
  },
  plusIcon: {
    width: 20,
    height: 20,
    tintColor: theme.text.accent,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s2,
  },
  tagPillSelected: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.action.secondary,
    borderWidth: 1,
    borderColor: theme.action.secondary,
    paddingVertical: theme.spacing.s1,
    paddingHorizontal: theme.spacing.s3,
    minHeight: 30,
    justifyContent: 'center',
  },
  tagTextSelected: {
    color: theme.text.secondary,
  },
  tagPlaceholder: {
    color: theme.text.muted,
    fontStyle: 'italic',
  },

  // ── Text Input ──
  textInputContainer: {
    marginTop: 10,
    backgroundColor: theme.surface.secondary,
    borderColor: theme.text.subtle2,
    borderWidth: 2,
    borderRadius: theme.radius.md,
    minHeight: 100,
  },
  textInput: {
    padding: 12,
    color: theme.text.primary,
    fontSize: 14,
    minHeight: 100,
  },

  // ── Toggles ──
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    color: theme.text.primary,
  },

  // ── Connect Button ──
  connectButtonWrapper: {
    alignSelf: 'stretch',
  },
  connectButton: {
    paddingVertical: theme.spacing.s3 + theme.spacing.s2,
    paddingHorizontal: theme.spacing.s5,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: theme.radius.md,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  anonymousText: {
    color: theme.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Connection History Bar ──
  historyBarContainer: {
    marginTop: 20,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    boxShadow: theme.elevation.level3,
  },
  historyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  historyBarText: {
    color: theme.text.accent,
  },
  historyChevron: {
    width: 14,
    height: 14,
    tintColor: theme.background.accent,
  },

  // ── Modal / Popup Shared ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },

  // ── Category Selection Sheet ──
  categorySheet: {
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
    fontSize: 16,
  },
  searchIcon: {
    width: 16,
    height: 14,
    tintColor: theme.text.muted,
  },
  categoryList: {
    flex: 1,
  },
  categoryListContent: {
    paddingHorizontal: theme.spacing.s4,
    paddingBottom: rt.insets.bottom + theme.spacing.s2,
    gap: theme.spacing.s4,
  },
  categoryCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.s3,
    gap: theme.spacing.s2,
  },
  categoryDescription: {
    color: theme.text.muted,
  },
  categoryErrorContainer: {
    alignItems: 'center',
    padding: theme.spacing.s4,
    gap: theme.spacing.s4,
  },
  retryButton: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.action.secondary,
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    alignItems: 'center',
    justifyContent: 'center',
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
  otherPlusIcon: {
    width: 28,
    height: 28,
    tintColor: theme.text.primary,
  },
}));
