import { AppText } from '@/components/AppText';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { router } from 'expo-router';

export default function TnS() {
  return (
    <View style={styles.container}>
      <AppText
        variant="title1"
        emphasis="emphasized"
        color="subtle1"
        textAlign="center"
      >
        Terms & Conditions
      </AppText>

      <Pressable style={styles.textContainer} onPress={() => router.push('/')}>
        <AppText style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
          Agree & Continue
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: theme.background.default,
    paddingTop: rt.insets.top + 80,
    gap: 50,
  },
  textContainer: {
    backgroundColor: '#570096',
    padding: 15,
    borderRadius: 25,
    width: 300,
    alignItems: 'center',
    marginTop: 510,
  },
}));
