import { View, StyleSheet } from 'react-native';
import Button from '@/components/button';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const Groups = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Button
          text="Chat Session"
          onPress={() =>
            router.navigate({
              pathname: '/user/session/[chat]',
              params: { chat: '1' },
            })
          }
        />
        <Button
          text="Test Volunteer Auth Flow"
          onPress={() => router.navigate('/start/volunteer/welcome' as any)}
          style={{ backgroundColor: '#FFD700', marginTop: 20 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default Groups;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
