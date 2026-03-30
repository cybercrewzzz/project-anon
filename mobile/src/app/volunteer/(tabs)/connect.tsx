import { AppText } from '@/components/AppText';
import {
  Animated,
  Pressable,
  View,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// ── Hooks ──────────────────────────────────────────────────────────────────
import {
  useVolunteerProfile,
  useUpdateVolunteerStatus,
} from '@/hooks/useVolunteerProfile';
import { useWaitingSessions } from '@/hooks/useWaitingSessions';
import type { WaitingSessionItem } from '@/api/schemas';

// =============================================================================
// Volunteer Connect Tab — Dynamic
//
// This screen shows:
//   1. Availability toggle (Offline / Active)
//   2. Experience points badge
//   3. Volunteer specialisations
//   4. Waiting sessions list (real-time from backend)
//   5. Connection history (expandable)
//
// Each waiting session card has a "Connect" button that opens the accept
// session popup → navigates to chat on success.
// =============================================================================

// ── Helpers ────────────────────────────────────────────────────────────────

/** Get initials from a name string (up to 2 chars) */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Compute relative wait time from an ISO string */
function getWaitingTime(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

// ── Gradient color palette for avatar backgrounds ──────────────────────────
const AVATAR_GRADIENTS: readonly [string, string][] = [
  ['#1D47DC', '#0E7FBC'],
  ['#9500FF', '#7B00D6'],
  ['#FF6B6B', '#EE5A24'],
  ['#00B894', '#00CEC9'],
  ['#6C5CE7', '#A29BFE'],
  ['#E17055', '#FAB1A0'],
];

function getAvatarGradient(index: number): readonly [string, string] {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ConnectScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 768;
  const router = useRouter();

  // ── Profile & availability ────────────────────────────────────────────
  const { data: profile, isLoading: isProfileLoading } = useVolunteerProfile();
  const { mutate: updateStatus, isPending } = useUpdateVolunteerStatus();
  const [statusError, setStatusError] = useState<string | null>(null);

  const [selectedOption, setSelectedOption] = useState<'Offline' | 'Active'>(
    'Offline',
  );

  useEffect(() => {
    if (profile?.isAvailable !== undefined) {
      setSelectedOption(profile.isAvailable ? 'Active' : 'Offline');
    }
  }, [profile?.isAvailable]);

  const handleToggle = useCallback(
    (option: 'Offline' | 'Active') => {
      if (option === selectedOption || isPending) return;
      setStatusError(null);
      const available = option === 'Active';
      const previousOption = selectedOption;
      setSelectedOption(option);
      updateStatus(available, {
        onError: () => {
          setSelectedOption(previousOption);
          setStatusError('Could not update availability. Please try again.');
        },
      });
    },
    [selectedOption, isPending, updateStatus],
  );

  // ── Waiting sessions ──────────────────────────────────────────────────
  const {
    data: waitingData,
    isLoading: isWaitingLoading,
    isError: isWaitingError,
    refetch: refetchWaiting,
  } = useWaitingSessions();

  const waitingSessions = waitingData?.sessions ?? [];

  // ── Connection history ────────────────────────────────────────────────
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // ── Toggle animations ────────────────────────────────────────────────
  const offlineAnim = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedOption === 'Offline') {
      Animated.parallel([
        Animated.timing(offlineAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(activeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(offlineAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(activeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [selectedOption, offlineAnim, activeAnim]);

  const offlineBackgroundColor = offlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#9500FF'],
  });

  const activeBackgroundColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#00C853'],
  });

  const offlineTextColor = offlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#666', '#FFFFFF'],
  });

  const activeTextColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#666', '#FFFFFF'],
  });

  // ── Connect handler ──────────────────────────────────────────────────
  const handleConnect = useCallback(
    (session: WaitingSessionItem) => {
      router.push({
        pathname: '/volunteer/accept/acceptSession' as never,
        params: {
          sessionId: session.sessionId,
          category: session.category ?? '',
        },
      });
    },
    [router],
  );

  // ── Experience points from profile ────────────────────────────────────
  const experiencePoints = profile?.experience?.points ?? 0;

  // ── Specialisations from profile ──────────────────────────────────────
  const specialisations = useMemo(
    () => profile?.specialisations ?? [],
    [profile?.specialisations],
  );

  // ── Force periodic re-render for "Waiting" times ──────────────────────
  const [, setTick] = useState(0);
  useEffect(() => {
    if (waitingSessions.length === 0) return;
    const interval = setInterval(() => setTick(t => t + 1), 30_000); // every 30s
    return () => clearInterval(interval);
  }, [waitingSessions.length]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F0E7FF', '#F9FBFF', '#BCDCF0']}
        style={styles.gradient}
        start={{ x: 0.05, y: 0.2 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0.2, 0.5, 1]}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* ═══════════ Top Toggle + Points Badge ═══════════ */}
        <View style={styles.topButtonsRow}>
          {/* Availability Toggle */}
          <View style={styles.toggleWrapper}>
            <View style={styles.toggleContainer}>
              <Pressable
                onPress={() => handleToggle('Offline')}
                disabled={isPending || isProfileLoading || !profile}
              >
                <Animated.View
                  style={[
                    styles.toggleButton,
                    { backgroundColor: offlineBackgroundColor },
                  ]}
                >
                  <Animated.Text style={{ color: offlineTextColor }}>
                    Offline
                  </Animated.Text>
                </Animated.View>
              </Pressable>
              <Pressable
                onPress={() => handleToggle('Active')}
                disabled={isPending || isProfileLoading || !profile}
              >
                <Animated.View
                  style={[
                    styles.toggleButton,
                    { backgroundColor: activeBackgroundColor },
                  ]}
                >
                  <Animated.Text style={{ color: activeTextColor }}>
                    Active
                  </Animated.Text>
                </Animated.View>
              </Pressable>
            </View>
          </View>

          {/* Experience Points Badge */}
          <View style={styles.toggleWrapperRight}>
            <LinearGradient
              colors={['#D2ECFE', '#F9FBFF', '#F6ECFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.singleButton}
            >
              <AppText style={styles.singleButtonText}>
                🌟 {experiencePoints}
              </AppText>
            </LinearGradient>
          </View>
        </View>

        {statusError !== null && (
          <AppText variant="footnote" style={styles.toggleError}>
            {statusError}
          </AppText>
        )}

        {/* ═══════════ Specialisations ═══════════ */}
        <View
          style={{
            alignItems: 'flex-start',
            gap: 5,
            width: '100%',
            maxWidth: isSmallScreen ? 500 : 800,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginLeft: screenWidth < 560 ? 10 : 5,
            }}
          >
            <AppText
              variant="callout"
              color="primary"
              style={{ textAlign: 'left' }}
            >
              Your Specialisations:
            </AppText>
          </View>
          <View style={styles.specialisations}>
            {specialisations.length === 0 ?
              <AppText variant="caption1" style={{ color: '#999' }}>
                No specialisations set
              </AppText>
            : specialisations.map(spec => (
                <View
                  key={spec.specialisationId}
                  style={styles.specialisationButton}
                >
                  <AppText style={styles.specialisationButtonText}>
                    {spec.name}
                  </AppText>
                </View>
              ))
            }
          </View>

          {/* ═══════════ Waiting Sessions ═══════════ */}
          <AppText
            variant="callout"
            style={{
              textAlign: 'left',
              marginTop: 20,
              marginLeft: screenWidth < 560 ? 10 : 5,
            }}
          >
            You Can Connect With:
          </AppText>

          <View style={styles.connectwith}>
            {/* Loading state */}
            {isWaitingLoading && (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#349EDB" />
                <AppText
                  variant="caption1"
                  style={{ color: '#666', marginTop: 8 }}
                >
                  Loading waiting sessions...
                </AppText>
              </View>
            )}

            {/* Error state */}
            {isWaitingError && !isWaitingLoading && (
              <View style={styles.emptyState}>
                <AppText variant="caption1" style={{ color: '#666' }}>
                  Could not load sessions.
                </AppText>
                <Pressable
                  style={styles.retryButton}
                  onPress={() => refetchWaiting()}
                >
                  <AppText
                    variant="caption1"
                    emphasis="emphasized"
                    style={{ color: '#349EDB' }}
                  >
                    Retry
                  </AppText>
                </Pressable>
              </View>
            )}

            {/* Empty state */}
            {!isWaitingLoading &&
              !isWaitingError &&
              waitingSessions.length === 0 && (
                <View style={styles.emptyState}>
                  <AppText variant="body" style={{ fontSize: 32 }}>
                    💬
                  </AppText>
                  <AppText
                    variant="caption1"
                    style={{ color: '#666', textAlign: 'center' }}
                  >
                    {selectedOption === 'Offline' ?
                      'Go active to see waiting sessions.'
                    : 'No one is waiting right now.\nNew sessions appear automatically.'
                    }
                  </AppText>
                </View>
              )}

            {/* Session cards */}
            {!isWaitingLoading &&
              !isWaitingError &&
              waitingSessions.length > 0 && (
                <View style={styles.connectProfilesContainer}>
                  {waitingSessions.map((session, index) => {
                    const gradient = getAvatarGradient(index);
                    const initials = getInitials(session.seekerNickname);
                    const waitTime = getWaitingTime(session.startedAt);

                    return (
                      <View key={session.sessionId} style={styles.profileCard}>
                        <View style={styles.profileInfo}>
                          <LinearGradient
                            colors={[gradient[0], gradient[1]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.profileImage}
                          >
                            <AppText style={styles.profileImageText}>
                              {initials}
                            </AppText>
                          </LinearGradient>
                          <View style={styles.profileTextContainer}>
                            <AppText
                              variant="callout"
                              style={{
                                fontSize: isSmallScreen ? 14 : 16,
                                fontWeight: '600',
                              }}
                            >
                              {session.seekerNickname}
                            </AppText>
                            <AppText
                              variant="caption1"
                              style={{
                                fontSize: isSmallScreen ? 10 : 12,
                                color: '#666666',
                              }}
                            >
                              {session.category ?
                                `Issue - ${session.category}`
                              : 'General Support'}
                            </AppText>
                            <AppText
                              variant="caption1"
                              style={{
                                fontSize: isSmallScreen ? 10 : 12,
                                color: '#666666',
                              }}
                            >
                              Waiting - {waitTime}
                            </AppText>
                          </View>
                        </View>
                        <Pressable onPress={() => handleConnect(session)}>
                          <LinearGradient
                            colors={['#1D47DC', '#0E7FBC']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.connectButton}
                          >
                            <AppText style={styles.connectButtonText}>
                              Connect
                            </AppText>
                          </LinearGradient>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
          </View>
        </View>

        {/* ═══════════ Connection History ═══════════ */}
        <View
          style={{
            alignItems: 'flex-start',
            gap: 5,
            width: '100%',
            maxWidth: isSmallScreen ? 500 : 800,
          }}
        >
          <Pressable
            onPress={() => setHistoryExpanded(!historyExpanded)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginLeft: screenWidth < 560 ? 10 : 5,
            }}
          >
            <AppText
              variant="callout"
              color="primary"
              style={{ textAlign: 'left' }}
            >
              Connection History
            </AppText>
            <AppText style={{ fontSize: 20, color: '#349EDB' }}>
              {historyExpanded ? '▼' : '▶'}
            </AppText>
          </Pressable>

          {historyExpanded && (
            <View style={styles.connectionhistory}>
              <View style={styles.connectProfilesContainer}>
                <AppText
                  variant="caption1"
                  style={{ color: '#999', textAlign: 'center', padding: 20 }}
                >
                  Connection history will be available soon.
                </AppText>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    backgroundColor: '#F9FBFF',
  },
  gradient: {
    position: 'absolute',
    inset: 0,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: rt.screen.width < 768 ? 35 : 55,
    paddingHorizontal: rt.screen.width < 768 ? 15 : 50,
    paddingBottom: 30,
    gap: rt.screen.width < 768 ? 30 : 50,
  },
  topButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: rt.screen.width < 560 ? 500 : 800,
  },
  toggleWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#349EDB',
    padding: 3,
    borderRadius: 30,
    gap: 5,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
    minWidth: 80,
    alignItems: 'center',
  },
  toggleWrapperRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  singleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#349EDB',
    alignItems: 'center',
  },
  singleButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  toggleError: {
    color: '#FF4444',
    textAlign: 'center',
    marginTop: -20,
  },
  specialisations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    paddingLeft: rt.screen.width < 560 ? 10 : 5,
  },
  specialisationButton: {
    backgroundColor: '#349EDB',
    paddingVertical: rt.screen.width < 768 ? 4 : 5,
    paddingHorizontal: rt.screen.width < 768 ? 8 : 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#4a6fa5',
  },
  specialisationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: rt.screen.width < 768 ? 12 : 14,
  },
  connectwith: {
    flexDirection: 'column',
    backgroundColor: '#349EDB33',
    padding: rt.screen.width < 560 ? 10 : 20,
    borderRadius: 30,
    gap: rt.screen.width < 560 ? 8 : 10,
    width: '85%',
    maxWidth: rt.screen.width < 560 ? 500 : 800,
    alignSelf: 'center',
  },
  connectProfilesContainer: {
    width: '100%',
    gap: 10,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: rt.screen.width < 560 ? 20 : 30,
    padding: rt.screen.width < 560 ? 8 : 12,
    paddingLeft: rt.screen.width < 560 ? 6 : 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rt.screen.width < 560 ? 8 : 12,
    flex: 1,
  },
  profileTextContainer: {
    flexDirection: 'column',
    gap: 2,
    flex: 1,
  },
  profileImage: {
    width: rt.screen.width < 560 ? 40 : 45,
    height: rt.screen.width < 560 ? 40 : 45,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  connectButton: {
    paddingVertical: rt.screen.width < 560 ? 6 : 8,
    paddingHorizontal: rt.screen.width < 560 ? 12 : 20,
    borderRadius: 20,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: rt.screen.width < 560 ? 12 : 14,
  },
  connectionhistory: {
    flexDirection: 'column',
    backgroundColor: '#349EDB33',
    padding: rt.screen.width < 560 ? 10 : 20,
    borderRadius: 30,
    gap: rt.screen.width < 560 ? 8 : 10,
    width: '85%',
    maxWidth: rt.screen.width < 560 ? 500 : 800,
    alignSelf: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#349EDB22',
    marginTop: 4,
  },
}));
