import React from 'react';
import { AppText } from '@/components/AppText';
import { TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export default function EnterEmailScreen() {
  return (
    <View style={styles.container}>
      <View>
        <AppText
          variant="screenTitle"
          color="primary"
          style={{ textAlign: 'left' }}
        >
          Reset Your Password 🔑
        </AppText>
        <AppText variant="body" style={{ textAlign: 'left', marginTop: 10, marginLeft: 5 }}>
          Please enter your email address below and we will send an OTP code to
          reset your password.
              </AppText>

        <AppText variant="listHeader" style = {{padding: 20, textAlign: 'left'}}> Email</AppText>

              <TextInput> </TextInput>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.secondary,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
