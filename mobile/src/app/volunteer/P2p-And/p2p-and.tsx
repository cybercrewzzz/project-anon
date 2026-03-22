import { AppText } from '@/components/AppText';
import { Pressable, View, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// ── PATCH /volunteer/status ───────────────────────────────────────────────────
import {
  useVolunteerProfile,
  useUpdateVolunteerStatus,
} from '@/hooks/useVolunteerProfile';
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileCardProps {
  initials: string;
  name: string;
  issue: string;
  time: string;
  colors: readonly [string, string, ...string[]];
  history?: boolean;
}

const ProfileCard = ({ initials, name, issue, time, colors, history }: ProfileCardProps) => (
  <View style={styles.profileCard}>
    <View style={styles.profileInfo}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileImage}
      >
        <AppText style={styles.profileImageText}>{initials}</AppText>
      </LinearGradient>
      <View style={styles.profileTextContainer}>
        <AppText variant="callout" style={styles.profileName}>
          {name}
        </AppText>
        <AppText variant="caption1" style={styles.profileIssueText}>
          Issue - {issue}
        </AppText>
        <AppText variant="caption1" style={styles.profileIssueText}>
          {history ? 'Session' : 'Waiting'} - {time}
        </AppText>
      </View>
    </View>
    {history ? (
      <View style={styles.historyTimeBadge}>
        <AppText style={styles.historyTimeText}>2 days ago</AppText>
      </View>
    ) : (
      <Pressable>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.connectButton}
        >
          <AppText style={styles.connectButtonText}>Connect</AppText>
        </LinearGradient>
      </Pressable>
    )}
  </View>
);

export default function VolunteerP2P() {
  const router = useRouter();

  // ── PATCH /volunteer/status ─────────────────────────────────────────────────
  const { data: profile, isLoading: isProfileLoading } = useVolunteerProfile();
  const { mutate: updateStatus, isPending } = useUpdateVolunteerStatus();
  const [statusError, setStatusError] = useState<string | null>(null);
  // ───────────────────────────────────────────────────────────────────────────

  const [selectedOption, setSelectedOption] = useState<'Offline' | 'Active'>('Offline');
  const [connectFilter, setConnectFilter] = useState<'Recommended' | 'All'>('Recommended');
  const [historyExpanded, setHistoryExpanded] = useState(false);

  useEffect(() => {
    if (profile?.isAvailable !== undefined) {
      setSelectedOption(profile.isAvailable ? 'Active' : 'Offline');
    }
  }, [profile?.isAvailable]);

  const handleToggle = (option: 'Offline' | 'Active') => {
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
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Toggle Row */}
        <View style={styles.topButtonsRow}>
          <View style={styles.toggleContainer}>
            <Pressable
              onPress={() => handleToggle('Offline')}
              disabled={isPending || isProfileLoading || !profile}
              style={[
                styles.toggleButton,
                selectedOption === 'Offline' && styles.toggleButtonOffline,
              ]}
            >
              <AppText
                style={[
                  styles.toggleText,
                  selectedOption === 'Offline' && styles.toggleTextActive,
                ]}
              >
                Offline
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => handleToggle('Active')}
              disabled={isPending || isProfileLoading || !profile}
              style={[
                styles.toggleButton,
                selectedOption === 'Active' && styles.toggleButtonOnline,
              ]}
            >
              <AppText
                style={[
                  styles.toggleText,
                  selectedOption === 'Active' && styles.toggleTextActive,
                ]}
              >
                Active
              </AppText>
            </Pressable>
          </View>

          <LinearGradient
            colors={['#D2ECFE', '#F9FBFF', '#F6ECFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pointsBadge}
          >
            <AppText style={styles.pointsText}>🌟 185</AppText>
          </LinearGradient>
        </View>

        {statusError && (
          <AppText variant="footnote" style={styles.errorText}>
            {statusError}
          </AppText>
        )}

        {/* Specialisations */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <AppText variant="callout" color="primary">
              Your Specialisations:
            </AppText>
            <Pressable
              style={styles.plusButton}
              onPress={() => router.push('/volunteer/Specialisations/specialisationFilter')}
            >
              <AppText style={styles.plusButtonText}>+</AppText>
            </Pressable>
          </View>
          
          <View style={styles.specialisationsBox}>
            {['Anxiety', 'Stress', 'Depression'].map(spec => (
              <View key={spec} style={styles.specPill}>
                <AppText style={styles.specPillText}>{spec}</AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Connect With */}
        <View style={styles.sectionContainer}>
          <AppText variant="callout" style={styles.sectionTitleSpaced}>
            You Can Connect With:
          </AppText>

          <View style={styles.connectBox}>
            <View style={styles.filterToggleContainer}>
              {['Recommended', 'All'].map(filter => {
                const isActive = connectFilter === filter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setConnectFilter(filter as any)}
                    style={[
                      styles.filterToggleButton,
                      isActive && styles.filterToggleButtonActive,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.filterToggleText,
                        isActive && styles.filterToggleTextActive,
                      ]}
                    >
                      {filter}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.profileList}>
              <ProfileCard 
                initials="JD" name="RecAnonUser89" issue="Stress" time="8 minutes" 
                colors={['#1D47DC', '#0E7FBC']} 
              />
              <ProfileCard 
                initials="SA" name="RecAnonUser159" issue="Anxiety" time="5 minutes" 
                colors={['#1D47DC', '#0E7FBC']} 
              />
              <ProfileCard 
                initials="MJ" name="RecAnonUser289" issue="Depression" time="2 minutes" 
                colors={['#1D47DC', '#0E7FBC']} 
              />
            </View>
          </View>
        </View>

        {/* Connection History */}
        <View style={styles.sectionContainer}>
          <Pressable
            onPress={() => setHistoryExpanded(!historyExpanded)}
            style={styles.historyHeader}
          >
            <AppText variant="callout" color="primary">
              Connection History
            </AppText>
            <AppText style={styles.historyIcon}>
              {historyExpanded ? '▼' : '▶'}
            </AppText>
          </Pressable>

          {historyExpanded && (
            <View style={styles.historyBox}>
              <View style={styles.profileList}>
                <ProfileCard 
                  initials="AL" name="AnonUser42" issue="Anxiety" time="45 minutes" 
                  colors={['#9500FF', '#7B00D6']} history 
                />
                <ProfileCard 
                  initials="TC" name="AnonUser231" issue="Stress" time="30 minutes" 
                  colors={['#9500FF', '#7B00D6']} history 
                />
                <ProfileCard 
                  initials="RK" name="AnonUser567" issue="Depression" time="60 minutes" 
                  colors={['#9500FF', '#7B00D6']} history 
                />
              </View>
            </View>
          )}
        </View>
        <StatusBar />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.default,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingTop: rt.insets.top + theme.spacing.s6,
    paddingHorizontal: theme.spacing.s4,
    paddingBottom: rt.insets.bottom + theme.spacing.s7,
    gap: theme.spacing.s6,
  },
  topButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface.muted,
    borderRadius: theme.radius.full,
    padding: 4,
  },
  toggleButton: {
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.radius.full,
    minWidth: 90,
    alignItems: 'center',
  },
  toggleButtonOffline: {
    backgroundColor: theme.action.primary, // Using purple
  },
  toggleButtonOnline: {
    backgroundColor: common.green[500] || '#00C853',
  },
  toggleText: {
    color: theme.text.muted,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: common.white,
  },
  pointsBadge: {
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border.primary, // Using purple border
  },
  pointsText: {
    color: theme.text.primary, // Using purple
    fontWeight: '600',
  },
  errorText: {
    color: theme.state.error,
    textAlign: 'center',
  },
  sectionContainer: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 600, // Bound width for large screens
    gap: theme.spacing.s2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
    marginBottom: theme.spacing.s1,
    paddingHorizontal: theme.spacing.s2,
  },
  sectionTitleSpaced: {
    paddingHorizontal: theme.spacing.s2,
    marginTop: theme.spacing.s3,
  },
  plusButton: {
    backgroundColor: theme.action.secondary, // Light blue
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border.secondary,
  },
  plusButtonText: {
    color: common.white,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  specialisationsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.surface.secondary, // Light blue tint
    padding: theme.spacing.s4,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.s3,
  },
  specPill: {
    backgroundColor: theme.action.secondary,
    paddingVertical: theme.spacing.s1,
    paddingHorizontal: theme.spacing.s3,
    borderRadius: theme.radius.full,
  },
  specPillText: {
    color: common.white,
    fontWeight: '600',
    fontSize: 13,
  },
  connectBox: {
    backgroundColor: theme.surface.secondary,
    padding: theme.spacing.s4,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.s4,
  },
  filterToggleContainer: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
  },
  filterToggleButton: {
    paddingVertical: theme.spacing.s1,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterToggleButtonActive: {
    borderColor: theme.border.primary, // Purple border
  },
  filterToggleText: {
    color: theme.text.muted,
    fontWeight: '600',
  },
  filterToggleTextActive: {
    color: theme.text.primary,
  },
  profileList: {
    gap: theme.spacing.s3,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.background.default,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s3,
    borderWidth: 1,
    borderColor: theme.border.default,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
    flex: 1,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    color: common.white,
    fontWeight: '700',
    fontSize: 16,
  },
  profileTextContainer: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontWeight: '600',
  },
  profileIssueText: {
    color: theme.text.muted,
  },
  connectButton: {
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.radius.full,
  },
  connectButtonText: {
    color: common.white,
    fontWeight: '600',
    fontSize: 13,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s2,
  },
  historyIcon: {
    fontSize: 18,
    color: theme.text.secondary, // Light blue
  },
  historyBox: {
    backgroundColor: theme.surface.secondary,
    padding: theme.spacing.s4,
    borderRadius: theme.radius.lg,
  },
  historyTimeBadge: {
    paddingVertical: theme.spacing.s1,
    paddingHorizontal: theme.spacing.s3,
    backgroundColor: theme.surface.muted,
    borderRadius: theme.radius.full,
  },
  historyTimeText: {
    fontSize: 12,
    color: theme.text.muted,
    fontWeight: '600',
  },
}));
