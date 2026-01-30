import { AppText } from '@/components/AppText';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

export default function TnS() {
  return (
    <View style={styles.container}>
      <View style={{alignItems: 'flex-start'}}>
        <AppText
          variant="screenTitle"
          color="primary"
          style={{ textAlign: 'top' }}
        >
          Welcome to Anora
        </AppText>
      </View>
        <View>
        <AppText variant="cardTitle" style={{ textAlign: 'center' }}>
          The Project Anon
        </AppText>
        </View>
    </View>
    );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background.default,
    marginTop: rt.insets.top,
    gap: 50,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));