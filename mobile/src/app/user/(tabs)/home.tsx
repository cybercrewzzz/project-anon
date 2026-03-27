import { View, ScrollView, ActivityIndicator } from 'react-native';
import React, { useEffect } from 'react';
import { AppText } from '@/components/AppText';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import SideImageCard from '@/components/sideImageCard';
import HomeTile from '@/components/homeTile';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/api/account';
import { useAuth } from '@/store/useAuth';

const Home = () => {
  const setAccount = useAuth(state => state.setAccount);
  const account = useAuth(state => state.account);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  useEffect(() => {
    if (profile) {
      // getMe returns AccountProfile, but useAuth expects Account.
      // We map the fields to match the store's Account interface.
      setAccount({
        accountId: profile.accountId,
        email: profile.email,
        nickname: profile.nickname,
        name: profile.name,
        roles: profile.roles,
      });
    }
  }, [profile, setAccount]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#F6E0FF', '#F9FBFF', '#D2ECFE']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0.38, 0.63, 0.8]}
      />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {isLoading && !account ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.greeting}>
                <AppText variant="subhead" emphasis="emphasized">
                  Good Morning, {account?.nickname || profile?.nickname || 'User'}!
                </AppText>
                <AppText variant="title1" emphasis="emphasized">
                  You&apos;re safe here
                </AppText>
              </View>
              <View style={styles.notificationIconBg}>
                <Image
                  source={require('@/assets/icons/notification.svg')}
                  style={styles.notificationIcon}
                  contentFit="contain"
                />
              </View>
            </View>
            <View style={styles.heroImageContainer}>
              <Image
                source={require('@/assets/images/hero.webp')}
                style={styles.heroImage}
              />
            </View>
            <SideImageCard
              title="Connect Me!"
              description="Let's openup to the things that matters among the people"
              ctaText="Join now"
              ctaIcon={require('@/assets/icons/start.svg')}
              image={require('@/assets/images/connectMeVector.webp')}
            />
            <View style={styles.tileContainer}>
              <HomeTile
                title="Group Rooms"
                description="Join topic-based community rooms"
                icon={require('@/assets/icons/groupRooms.svg')}
              />
              <HomeTile
                title="Community Space"
                description="Share stories, Read advices"
                icon={require('@/assets/icons/communitySpace.svg')}
              />
            </View>
            <View>
              <SideImageCard
                title="Professional Connect"
                description="Talk to licensed professionals"
                ctaText="Premium"
                image={require('@/assets/images/professionalConnectVector.webp')}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    paddingTop: rt.insets.top + theme.spacing.s7,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + theme.spacing.s5,
    paddingRight: rt.insets.right + theme.spacing.s5,
  },
  gradient: {
    position: 'absolute',
    inset: 0,
  },
  contentContainer: {
    flexGrow: 1,
    gap: theme.spacing.s4,
  },
  loadingContainer: {
    flex: 1,
    paddingTop: theme.spacing.s8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    justifyContent: 'center',
  },
  notificationIconBg: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.s3,
    backgroundColor: theme.background.default,
    borderRadius: theme.radius.full,
  },
  notificationIcon: {
    width: 24,
    height: 24,
  },
  heroImageContainer: {
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  heroImage: {
    aspectRatio: '2',
  },
  tileContainer: {
    flexDirection: 'row',
    gap: theme.spacing.s4,
  },
}));
