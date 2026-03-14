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
          text="Verify"
          onPress={() => router.navigate('/volunteer/getStarted/verify')}
        />
        <Button
          text="Sign Up"
          onPress={() => router.navigate('/volunteer/getStarted/signUp')}
        />
        <Button
          text="Select Language"
          onPress={() =>
            router.navigate('/volunteer/getStarted/selectLanguage')
          }
        />
        <Button
          text="Chat Session"
          onPress={() =>
            router.navigate({
              pathname: '/user/session/[chat]',
              params: { chat: '1' },
            })
          }
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
