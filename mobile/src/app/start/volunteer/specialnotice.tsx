import { AppText } from '@/components/AppText';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { router } from 'expo-router';

export default function TnS() {
  const { theme } = useUnistyles();

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
          style={{ marginTop: 100, borderRadius: theme.radius.sm }}
        >
          Follow the strictest guidelines when dealing with users and protect
          their data.
        </AppText>
      </View>

      <Pressable
        style={styles.textContainer}
        onPress={() => router.replace('/volunteer/(tabs)/home' as any)}
      >
        <AppText style={styles.buttonText}>Got It !</AppText>
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
    gap: theme.spacing.s7,
  },
  containernote: {
    backgroundColor: theme.background.secondary,
    padding: theme.spacing.s5,
    borderRadius: theme.radius.sm,
    width: '90%',
    maxWidth: 420,
    minHeight: 540,
    alignItems: 'center',
    gap: theme.spacing.s3,
  },
  textContainer: {
    backgroundColor: theme.action.primary,
    padding: theme.spacing.s4,
    borderRadius: theme.radius.xl,
    width: 300,
    alignItems: 'center',
    marginTop: theme.spacing.s7,
  },
  buttonText: {
    color: theme.action.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
}));
