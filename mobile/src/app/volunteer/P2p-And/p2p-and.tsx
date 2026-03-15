import { AppText } from '@/components/AppText';
import {
  Animated,
  Pressable,
  View,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useVolunteerStatus,
  useUpdateVolunteerStatus,
} from '@/hooks/useVolunteerProfile';

// =============================================================================
// ENDPOINT: PATCH /volunteer/status
// Hook imported from useVolunteerProfile.ts
// useVolunteerStatus  → reads isAvailable to set initial toggle state
// useUpdateVolunteerStatus → called when toggle is pressed
// =============================================================================

export default function Index() {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 768;

  // ── PATCH /volunteer/status ─────────────────────────────────────────────────
  // Reads isAvailable from the profile to set the initial toggle state
  const { data: profile } = useVolunteerStatus();

  // Fires PATCH /volunteer/status when the toggle is pressed
  const { mutate: updateStatus } = useUpdateVolunteerStatus();

  // ── Toggle state — driven by real isAvailable from API ─────────────────────
  // Initialises from profile.isAvailable once loaded,
  // defaults to 'Offline' while loading
  const [selectedOption, setSelectedOption] = useState<'Offline' | 'Active'>(
    'Offline',
  );

  // Sync local toggle state when profile loads
  useEffect(() => {
    if (profile?.isAvailable !== undefined) {
      setSelectedOption(profile.isAvailable ? 'Active' : 'Offline');
    }
  }, [profile?.isAvailable]);

  // ── Handle toggle press ─────────────────────────────────────────────────────
  const handleToggle = (option: 'Offline' | 'Active') => {
    const available = option === 'Active';
    setSelectedOption(option); // update local UI immediately
    updateStatus(available); // fire PATCH /volunteer/status
  };

  const [connectFilter, setConnectFilter] = useState<'Recommended' | 'All'>(
    'Recommended',
  );
  const [_historyExpanded, _setHistoryExpanded] = useState(false);
  const offlineAnim = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(0)).current;
  const recommendedAnim = useRef(new Animated.Value(1)).current;
  const allAnim = useRef(new Animated.Value(0)).current;

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
  });

  useEffect(() => {
    if (connectFilter === 'Recommended') {
      Animated.parallel([
        Animated.timing(recommendedAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(allAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(recommendedAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(allAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
      ]).start();
    }
  });

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

  const recommendedBackgroundColor = recommendedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#9500FF'],
  });

  const allBackgroundColor = allAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#9500FF'],
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Top Toggle Buttons Row */}
        <View style={styles.topButtonsRow}>
          {/* Offline / Active toggle — wired to PATCH /volunteer/status */}
          <View style={styles.toggleWrapper}>
            <View style={styles.toggleContainer}>
              {/* Pressing Offline → calls PATCH /volunteer/status { available: false } */}
              <Pressable onPress={() => handleToggle('Offline')}>
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
              {/* Pressing Active → calls PATCH /volunteer/status { available: true } */}
              <Pressable onPress={() => handleToggle('Active')}>
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

          {/* Right Top Bubble Button */}
          <View style={styles.toggleWrapperRight}>
            <Pressable onPress={() => console.log('Button pressed')}>
              <LinearGradient
                colors={['#D2ECFE', '#F9FBFF', '#F6ECFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.singleButton}
              >
                <AppText style={styles.singleButtonText}>🌟 185</AppText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {/* Specialisations section — unchanged, PATCH /volunteer/profile comes later */}
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
            <Pressable
              style={styles.plusButton}
              onPress={() => console.log('Add specialisation')}
            >
              <AppText style={styles.plusButtonText}>+</AppText>
            </Pressable>
          </View>
          <View style={styles.specialisations}>
            <Pressable style={styles.specialisationButton}>
              <AppText style={styles.specialisationButtonText}>Anxiety</AppText>
            </Pressable>
            <Pressable style={styles.specialisationButton}>
              <AppText style={styles.specialisationButtonText}>Stress</AppText>
            </Pressable>
            <Pressable style={styles.specialisationButton}>
              <AppText style={styles.specialisationButtonText}>
                Depression
              </AppText>
            </Pressable>
          </View>

          {/* Connect With Section — unchanged, static for now */}
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
            <View style={styles.connectToggleContainer}>
              <Pressable onPress={() => setConnectFilter('Recommended')}>
                <Animated.View
                  style={[
                    styles.connectToggleButton,
                    {
                      borderColor: recommendedBackgroundColor,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <Animated.Text
                    style={[
                      styles.connectToggleText,
                      { color: recommendedBackgroundColor },
                    ]}
                  >
                    Recommended
                  </Animated.Text>
                </Animated.View>
              </Pressable>
              <Pressable onPress={() => setConnectFilter('All')}>
                <Animated.View
                  style={[
                    styles.connectToggleButton,
                    {
                      borderColor: allBackgroundColor,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <Animated.Text
                    style={[
                      styles.connectToggleText,
                      { color: allBackgroundColor },
                    ]}
                  >
                    All
                  </Animated.Text>
                </Animated.View>
              </Pressable>
            </View>
          </View>
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
  topButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 30,
    marginTop: 0,
    paddingHorizontal: 0,
  },
  toggleWrapper: {
    position: 'absolute',
    left: rt.screen.width < 768 ? 10 : 16,
    zIndex: 10,
    marginTop: rt.screen.width < 560 ? 0 : 8,
    marginLeft: rt.screen.width < 560 ? 14 : 18,
  },
  toggleWrapperRight: {
    position: 'absolute',
    fontSize: rt.screen.width < 560 ? 14 : 18,
    right: rt.screen.width < 560 ? 14 : 18,
    zIndex: 10,
    marginTop: rt.screen.width < 560 ? 0 : 8,
    borderColor: '#9500FF',
    borderWidth: 2,
    borderRadius: 25,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5E5',
    borderRadius: 25,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    paddingVertical: rt.screen.width < 768 ? 8 : 10,
    paddingHorizontal: rt.screen.width < 768 ? 16 : 24,
    borderRadius: 20,
    minWidth: rt.screen.width < 768 ? 80 : 120,
    alignItems: 'center',
  },
  singleButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  singleButtonText: {
    color: '#9500FF',
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialisations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#349EDB33',
    padding: rt.screen.width < 560 ? 10 : 15,
    borderRadius: 30,
    gap: rt.screen.width < 560 ? 8 : 10,
    width: '85%',
    maxWidth: rt.screen.width < 560 ? 500 : 800,
    alignSelf: 'center',
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
  plusButton: {
    backgroundColor: '#349EDB',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4a6fa5',
  },
  plusButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
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
  connectToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5E5',
    borderRadius: 30,
    padding: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  connectToggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  connectToggleText: {
    fontWeight: '600',
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
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
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
}));
