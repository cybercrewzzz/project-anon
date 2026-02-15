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
        text="Sign In"
        onPress={() => router.navigate('/user/authScreens/signIn')}
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
