import { AppText } from '@/components/AppText';
import { Animated, Pressable, View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Background } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const [selectedOption, setSelectedOption] = useState<'Offline' | 'Active'>('Offline');
  const [connectFilter, setConnectFilter] = useState<'Recommended' | 'All'>('Recommended');
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
  }, [selectedOption]);

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
  }, [connectFilter]);

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

  const recommendedTextColor = recommendedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#666', '#FFFFFF'],
  });

  const allTextColor = allAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#666', '#FFFFFF'],
  });

  return (
    <View style={styles.container}>
      {/* Bubble Toggle Button */}
      <View style={styles.toggleWrapper}>
        <View style={styles.toggleContainer}>
        <Pressable onPress={() => setSelectedOption('Offline')}>
          <Animated.View
            style={[
              styles.toggleButton,
              { backgroundColor: offlineBackgroundColor },
            ]}
          >
            <Animated.Text
              style={[
                styles.toggleText,
                { color: offlineTextColor },
              ]}
            >
              Offline
            </Animated.Text>
          </Animated.View>
        </Pressable>
        <Pressable onPress={() => setSelectedOption('Active')}>
          <Animated.View
            style={[
              styles.toggleButton,
              { backgroundColor: activeBackgroundColor },
            ]}
          >
            <Animated.Text
              style={[
                styles.toggleText,
                { color: activeTextColor },
              ]}
            >
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
            <AppText style={styles.singleButtonText}>
             🌟 185
            </AppText>
          </LinearGradient>
        </Pressable> 
      </View> 
 
      {/* Specialisations section */}        
      <View style={{ alignItems: 'flex-start', gap: 5 }}> 
        <AppText
          variant="cardTitle"
          color="primary"
          style={{ textAlign: 'left' }}
        >
          Your Specialisations:
        </AppText>
        <View style={styles.specialisations}>
          <Pressable style={styles.specialisationButton}>
            <AppText style={styles.specialisationButtonText}>Anxiety</AppText>
          </Pressable>
          <Pressable style={styles.specialisationButton}>
            <AppText style={styles.specialisationButtonText}>Stress</AppText>
          </Pressable>
          <Pressable style={styles.specialisationButton}>
            <AppText style={styles.specialisationButtonText}>Depression</AppText>
          </Pressable>
        </View>

        {/* Connect With Section */}
        <AppText variant="cardTitle" style={{ textAlign: 'left', marginTop: 20 }}>
          You Can Connect With:
        </AppText>
        
        <View style={styles.connectwith}>
          {/* Connect Filter Toggle */}
          <View style={styles.connectToggleContainer}>
            <Pressable onPress={() => setConnectFilter('Recommended')}>
              <Animated.View
                style={[
                  styles.connectToggleButton,
                  { backgroundColor: recommendedBackgroundColor },
                ]}
              >
                <Animated.Text
                  style={[
                    styles.toggleText,
                    { color: recommendedTextColor },
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
                  { backgroundColor: allBackgroundColor },
                ]}
              >
                <Animated.Text
                  style={[
                    styles.toggleText,
                    { color: allTextColor },
                  ]}
                >
                  All
                </Animated.Text>
              </Animated.View>
            </Pressable>
          </View>

          {/* Profile Cards */}
          <View style={styles.connectProfilesContainer}>
            {/* Profile Card 1 */}
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <View style={styles.profileImage}>
                  <AppText style={styles.profileImageText}>JD</AppText>
                </View>
                <Text style={styles.profileName}>John Doe</Text>
              </View>
              <Pressable style={styles.connectButton}>
                <AppText style={styles.connectButtonText}>Connect</AppText>
              </Pressable>
            </View>

            {/* Profile Card 2 */}
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <View style={styles.profileImage}>
                  <AppText style={styles.profileImageText}>SA</AppText>
                </View>
                <Text style={styles.profileName}>Sarah Anderson</Text>
              </View>
              <Pressable style={styles.connectButton}>
                <AppText style={styles.connectButtonText}>Connect</AppText>
              </Pressable>
            </View>

            {/* Profile Card 3 */}
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <View style={styles.profileImage}>
                  <AppText style={styles.profileImageText}>MJ</AppText>
                </View>
                <Text style={styles.profileName}>Mike Johnson</Text>
              </View>
              <Pressable style={styles.connectButton}>
                <AppText style={styles.connectButtonText}>Connect</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
      <View>
        <AppText variant="screenTitle">screenTitle</AppText>
        <AppText variant="sectionTitle">sectionTitle</AppText>
        <AppText variant="cardTitle">cardTitle</AppText>
        <AppText variant="listHeader">listHeader</AppText>
        <AppText variant="body">body</AppText>
        <AppText variant="bodySecondary">bodySecondary</AppText>
        <AppText variant="caption">caption</AppText>
        <Pressable style={{backgroundColor: "#9500FF", padding: 15, borderRadius: 25, width: 300, alignItems: "center"}} onPress={() => router.push("/p2p-And/p2p-and")}>
          <AppText>p2p</AppText>
        </Pressable>
      </View>
      <StatusBar />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: theme.background.default,
    gap: 50,
    paddingTop: 180,
    paddingLeft: 50,
  },
  toggleWrapper: {
    position: 'absolute',
    top: rt.insets.top + 10,
    left: 16,
    zIndex: 10,
    marginTop: 60,
    marginLeft: 30,
  },
  toggleWrapperRight: {
    position: 'absolute',
    top: rt.insets.top + 10,
    fontSize: 18,
    right: 16,
    zIndex: 10,
    marginTop: 60,
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
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  toggleButtonActivePurple: {
    backgroundColor: 'theme.action.primary',
  },
  toggleButtonActiveGreen: {
    backgroundColor: 'theme.action.success',
  },
  toggleText: {
    color: '#666',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#349EDB33' ,
    padding: 15,
    borderRadius: 30,
    gap: 10,
    width: '100%',
  },
  specialisationButton: {
    backgroundColor: '#349EDB',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#4a6fa5',
  },
  specialisationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  connectwith: {
    flexDirection: 'column',
    backgroundColor: '#349EDB33',
    padding: 15,
    borderRadius: 30,
    gap: 10,
    width: '100%',
  },
  connectToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5E5',
    borderRadius: 25,
    padding: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  connectToggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
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
    borderRadius: 30,
    padding: 12,
    paddingLeft: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#9500FF',
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
    color: '#333333',
  },
  connectButton: {
    backgroundColor: '#9500FF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 350,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
}));