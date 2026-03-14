import { AppText } from '@/components/AppText';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';
import { useRouter } from 'expo-router';

const ResetPassword = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Stop loading after 5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
      router.replace('/user/start/authScreens/signIn' as any);
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/images/resetPasswordSuccessful.webp')}
            style={styles.image}
          />
        </View>
        <View>
          <AppText
            variant="title3"
            color="primary"
            emphasis="emphasized"
            style={styles.textLine1}
          >
            Reset Password Successful!
          </AppText>
          <AppText variant="subhead" color="primary" style={styles.textLine2}>
            Please Wait
          </AppText>
          <AppText variant="subhead" color="primary" style={styles.textLine3}>
            You will be directed to the sign in screen.
          </AppText>
        </View>

        {/* Animated Loader */}
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#9500FF" />
          </View>
        )}
      </View>
    </View>
  );
};

export default ResetPassword;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.overlay,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + theme.spacing.s4,
    paddingRight: rt.insets.right + theme.spacing.s4,
    justifyContent: 'center',
  },

  cardContainer: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.mdSoft,
    width: '100%',
    paddingVertical: theme.spacing.s7,
    paddingHorizontal: theme.spacing.s5,
    alignItems: 'center',
    elevation: 10,
  },

  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: theme.spacing.s6,
  },

  image: {
    width: 200,
    height: 185,
  },

  textLine1: {
    justifyContent: 'center',
    textAlign: 'center',
  },

  textLine2: {
    paddingTop: theme.spacing.s6,
    justifyContent: 'center',
    textAlign: 'center',
  },

  textLine3: {
    paddingTop: theme.spacing.s3,
    marginTop: theme.spacing.s3,
    justifyContent: 'center',
    textAlign: 'center',
  },

  loaderContainer: {
    marginTop: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
