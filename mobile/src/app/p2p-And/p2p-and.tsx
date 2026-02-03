import { AppText } from '@/components/AppText';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useState } from 'react';

export default function Index() {
  const [selectedOption, setSelectedOption] = useState<'volunteer' | 'organization'>('volunteer');

  return (
    <View style={styles.container}>
      {/* Bubble Toggle Button */}
      <View style={styles.toggleWrapper}>
        <View style={styles.toggleContainer}>
        <Pressable
          style={[
            styles.toggleButton,
            selectedOption === 'volunteer' && styles.toggleButtonActive,
          ]}
          onPress={() => setSelectedOption('volunteer')}
        >
          <AppText
            style={[
              styles.toggleText,
              selectedOption === 'volunteer' && styles.toggleTextActive,
            ]}
          >
            Volunteer
          </AppText>
        </Pressable>
        <Pressable
          style={[
            styles.toggleButton,
            selectedOption === 'organization' && styles.toggleButtonActive,
          ]}
          onPress={() => setSelectedOption('organization')}
        >
          <AppText
            style={[
              styles.toggleText,
              selectedOption === 'organization' && styles.toggleTextActive,
            ]}
          >
            Organization
          </AppText>
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
            185
          </AppText>
        </Pressable>
      </View>

      <View>
        <AppText
          variant="screenTitle"
          color="primary"
          style={{ textAlign: 'center' }}
        >
          Welcome to Anora
        </AppText>
        <AppText variant="cardTitle" style={{ textAlign: 'center' }}>
          The Project Anon
        </AppText>
        <AppText style={{ textAlign: 'center' }}>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background.default,
    gap: 50,
  },
  toggleWrapper: {
    position: 'absolute',
    top: rt.insets.top + 10,
    left: 16,
    zIndex: 10,
    marginTop: 60,
  },
  toggleWrapperRight: {
    position: 'absolute',
    top: rt.insets.top + 10,
    right: 16,
    zIndex: 10,
    marginTop: 60,
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
  toggleButtonActive: {
    backgroundColor: '#9500FF',
  },
  toggleText: {
    color: '#666',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  singleButton: {
    backgroundColor: '#9500FF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  singleButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
