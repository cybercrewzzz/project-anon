import { View, Pressable } from 'react-native';
import React from 'react';
import { AppText } from '@/components/AppText';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

const Groups = () => {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Pressable onPress={() => router.navigate('/user/authScreens/signIn')}>
        <AppText>Sign In</AppText>
      </Pressable>
    </View>
  );
};

export default Groups;

const styles = StyleSheet.create(theme => ({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
