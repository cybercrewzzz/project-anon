import { View, ScrollView } from 'react-native';
import React from 'react';
import { AppText } from '@/components/AppText';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import SideImageCard from '@/components/sideImageCard';
import HomeTile from '@/components/homeTile';
import { useRouter } from 'expo-router';

const Home = () => {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#F0E7FF', '#F9FBFF', '#BCDCF0']}
        style={styles.gradient}
        start={{ x: 0.05, y: 0.2 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0.2, 0.5, 1]}
      />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.greeting}>
          <AppText variant="subhead" emphasis="emphasized">
            Good Morning, Volunteer!
          </AppText>
          <AppText variant="title1" emphasis="emphasized">
            Community needs you
          </AppText>
        </View>
        <View style={styles.heroImageContainer}>
          <Image
            source={require('@/assets/images/hero.webp')}
            style={styles.heroImage}
          />
        </View>
        <SideImageCard
          title="Start Your Outreach"
          description="Let's make a difference together. Lend your hand, share your strength"
          ctaText="Join now"
          ctaIcon={require('@/assets/icons/start.svg')}
          image={require('@/assets/images/startOutreachVector.webp')}
          onPress={() => router.push('/volunteer/P2p-And/p2p-and')}
        />
        <View style={styles.tileContainer}>
          <HomeTile
            title="Manage Rooms"
            description="Host and moderate topic-based community support rooms"
            icon={require('@/assets/icons/groupRooms.svg')}
            onPress={() => router.push('/coming-soon')}
          />
          <HomeTile
            title="Community Space"
            description="You're creating safe spaces with every conversation"
            icon={require('@/assets/icons/communitySpace.svg')}
            onPress={() => router.push('/coming-soon')}
          />
        </View>
        <View>
          <SideImageCard
            title="Rapid Response"
            description="Lend your ear, share strength, empower others with your compassion"
            image={require('@/assets/images/rapidResponseVector.webp')}
            onPress={() => router.push('/coming-soon')}
          />
        </View>
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
    gap: theme.spacing.s4,
  },
  greeting: {
    justifyContent: 'center',
  },
  heroImageContainer: {
    flex: 1,
    backgroundColor: 'black',
    width: '100%',
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    aspectRatio: '2',
  },
  tileContainer: {
    flexDirection: 'row',
    gap: theme.spacing.s4,
  },
}));
