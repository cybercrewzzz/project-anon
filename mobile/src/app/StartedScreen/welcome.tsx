import { AppText } from '@/components/AppText';
import { Button, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Image } from 'react-native';
import { purple } from '@/theme/palettes/purple';
import { common } from '@/theme/palettes/common';
import { Platform, TextStyle } from 'react-native';
import { typography, weight } from '@/theme/tokens/typography';


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

       {/* Image in between */}
      <Image
        source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
        style={{ width: 100, height: 100 }}
      />

      {/* Bottom */}
      <View style={styles.bottom}>
        <Pressable
          style={styles.button}
          
        >
          <AppText style={styles.buttonText}>
            
            Get Started
          </AppText>
        </Pressable>

        <AppText style={styles.volunteerText}onPress={() => router.navigate('/StartedScreen/signup')}>
          Continue as a Volunteer
        </AppText>
       
      </View>

      <StatusBar />
    </View>
  );
}

const styles = StyleSheet.create((_theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor:'#D2ECFE',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: rt.insets.top + 40,
    paddingBottom: 80,
  },

  welcomeText: {
    fontWeight: weight.semiBold,
    fontSize: 32,
    color: purple[500],
    textAlign: 'center',
    lineHeight: 40,
  },

  bottom: {
    alignItems: 'center',
    gap: 20,
  },

  button: {
    backgroundColor: _theme.background.accent,
    padding: 12,
    borderRadius: 25,
    width: 300,
    alignItems: 'center',
  },

  buttonText: {
    color: _theme.text.secondary,
    fontWeight: 'bold',
  },

  volunteerText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: common.blue[500],
  },
}));
