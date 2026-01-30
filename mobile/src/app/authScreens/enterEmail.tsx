import React from 'react';
import { AppText } from '@/components/AppText';
import { Pressable, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';


export default function EnterEmailScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View>
          <AppText
            variant="sectionTitle"
            color="primary"
            style={{ textAlign: 'left',paddingLeft:5 }}
          >
            Reset Your Password 🔑
          </AppText>
          <AppText
            variant="body"
            style={{
              textAlign: 'left',
              marginTop: 20,
              marginLeft: 5,
              paddingLeft: 5,
            }}
          >
            Please enter your email address below and we will send an OTP code
            to reset your password.
          </AppText>
        </View>

        <View>
          <AppText
            variant="listHeader"
            style={{
              paddingTop: 50,
              paddingBottom: 10,
              marginLeft: 10,
              textAlign: 'left',
            }}
          >
            {' '}
            Email
          </AppText>
          <View>
            <TextInput style={styles.input} placeholder='example@gmail.com'/>
            {/* <AppText variant='bodySecondary' style={{ marginLeft: 25,marginBottom: 10 }}>
              example@gmail.com
            </AppText> */}
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.button}>
          <AppText variant="listHeader" color = "secondary" >
            {' '}
            Continue{' '}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.surface.primary,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
  },
  contentContainer: {
    justifyContent: 'flex-start',
    paddingTop: rt.insets.top + 30,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 64,
  },
  input: {
    backgroundColor: theme.surface.secondary,
    height: 44,
    borderRadius: 12,
    padding: 10,
    marginTop: 2,
    marginLeft: 10,
    marginRight: 10,
    // Shadow for Android
    elevation: 2,
  },
  button: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 15,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: theme.action.secondary,
  },
}));
