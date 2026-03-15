import { View } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import Button from '@/components/button';

const Groups = () => {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Button
        text="Get Started"
        onPress={() => router.push('/user/start/welcome' as any)}
      />
      <Button
        text="Sign In"
        onPress={() => router.push('/user/start/authScreens/signIn' as any)}
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
  );
};

export default Groups;

const styles = StyleSheet.create(theme => ({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background.default,
  },
}));
