import { AppText } from '@/components/AppText';
import { Animated, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Background } from '@react-navigation/elements';

export default function Index() {
  const [selectedOption, setSelectedOption] = useState<'Offline' | 'Active'>('Offline');
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
  }, [selectedOption]);

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
        <Pressable
          style={styles.singleButton} 
          onPress={() => console.log('Button pressed')}
        > 
          <AppText style={styles.singleButtonText}>
           🌟 185
          </AppText> 
        </Pressable> 
      </View> 
 
      <View style={{ alignItems: 'flex-start', gap: 5 }}> 
        <AppText
          variant="cardTitle"
          color="primary"
          style={{ textAlign: 'left' }}
        >
          Your Specialisations
        </AppText>
              <View>
                
              </View>
        <AppText variant="cardTitle" style={{ textAlign: 'left' }}>
          The Project Anon
        </AppText>
        <AppText style={{ textAlign: 'left' }}>
          - Proudly presented by SDGP-140 -
        </AppText>
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
    backgroundColor: '#9500FF',
  },
  toggleButtonActiveGreen: {
    backgroundColor: '#00C853',
  },
  toggleText: {
    color: '#666',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  singleButton: {
    backgroundColor: '#FFFFFF',
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
}));
