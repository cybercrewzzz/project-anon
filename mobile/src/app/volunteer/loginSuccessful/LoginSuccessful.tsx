import { AppText } from '@/components/AppText';
import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';

const LoginSuccessful = () => {
  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: 32,
          }}
        >
          <Image
            source={require('@/assets/images/loginSuccessful.webp')}
            style={{ width: 200, height: 185 }}
          />
        </View>
        <View>
          <AppText
            variant="title3"
            color="primary"
            emphasis="emphasized"
            style={{ justifyContent: 'center', textAlign: 'center' }}
          >
            Login Successful!
          </AppText>
          <AppText
            variant="subhead"
            color="primary"
            style={{
              paddingTop: 32,
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            Please Wait
          </AppText>
          <AppText
            variant="subhead"
            color="primary"
            style={{
              paddingTop: 8,
              marginTop: 8,
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            You will be directed to the homepage.
          </AppText>
        </View>
      </View>
    </View>
  );
};

export default LoginSuccessful;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: '#333333',
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
    justifyContent: 'center',
  },

  cardContainer: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.mdSoft,
    width: '100%',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 10,
  },
}));
