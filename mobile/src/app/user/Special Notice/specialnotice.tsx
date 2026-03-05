import { AppText } from '@/components/AppText';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { router } from 'expo-router';

export default function TnS() {
  return (
    <View style={styles.container}>
      <View style={styles.containernote}>
        <AppText
          variant="title2"
          emphasis="emphasized"
          color="subtle1"
          textAlign="center"
        >
          Special Note
        </AppText>
        <AppText
          variant="body"
          emphasis="regular"
          color="subtle1"
          textAlign="center"
          style={{ marginTop: 100, borderRadius: 5 }}
        >
          Hide and Protect Your Data.
        </AppText>
      </View>

      <Pressable style={styles.textContainer} onPress={() => router.push('/')}>
        <AppText style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
          Got It !
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
  containernote: {
    backgroundColor: theme.background.secondary,
    padding: 24,
    borderRadius: 10,
    width: '90%',
    maxWidth: 420,
    minHeight: 540,
    alignItems: 'center',
    gap: 10,
  },
  textContainer: {
    backgroundColor: '#570096',
    padding: 15,
    borderRadius: 25,
    width: 300,
    alignItems: 'center',
    marginTop: 50,
  },
}));
