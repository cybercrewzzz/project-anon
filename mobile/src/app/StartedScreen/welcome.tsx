import { AppText } from '@/components/AppText';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

export default function Welcome() {
  return (
    <View style={styles.container}>

      {/* Top*/}
      <AppText
        variant="screenTitle"
        style={styles.welcomeText}
      >
        Welcome!
      </AppText>

      {/* Bottom */}
      <View style={styles.bottom}>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/signup')}
        >
          <AppText style={styles.buttonText}>
            Get Started
          </AppText>
        </Pressable>

        <AppText style={styles.volunteerText}>
          Continue as a Volunteer
        </AppText>
      </View>

      <StatusBar />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: '#D2ECFE',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: rt.insets.top + 40,
    paddingBottom: 80,
  },

  welcomeText: {
    fontWeight: 'bold',
    color: '#9500FF',
    textAlign: 'center',
    padding: 80
  },

  bottom: {
    alignItems: 'center',
    gap: 20,
  },

  button: {
    backgroundColor: '#9500FF',
    padding: 12,
    borderRadius: 25,
    width: 300,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  volunteerText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#349EDB',
  },
}));
