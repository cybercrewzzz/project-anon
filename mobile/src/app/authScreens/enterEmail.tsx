import React from 'react';
import { AppText } from '@/components/AppText';
import { Pressable, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export default function EnterEmailScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <AppText
          variant="sectionTitle"
          color="primary"
          style={{ textAlign: 'left',paddingLeft: 10 }}
        >
          Reset Your Password 🔑
        </AppText>
        <AppText
          variant="body"
          style={{ textAlign: 'left', marginTop: 20, marginLeft: 5, paddingLeft: 5 }}
        >
          Please enter your email address below and we will send an OTP code to
          reset your password.
        </AppText>

        <View>
          <AppText
            variant="listHeader"
            style={{ paddingTop: 50, paddingBottom:10, marginLeft: 10, textAlign: 'left' }}
          >
            {' '}
            Email
          </AppText>

          <TextInput style={styles.input} placeholder='example@gmail.com'/>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.button}>
          <AppText variant='listHeader' style={{color: "#FFFFFF"}}> Continue </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 100,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  buttonContainer: {
    paddingBottom: 60,
  },
  input: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 6,
    padding: 10,
    marginTop: 2,
    marginLeft: 10,
    marginRight: 10,
  },
  button: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 15,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: "#9500FF",
  }
}));
