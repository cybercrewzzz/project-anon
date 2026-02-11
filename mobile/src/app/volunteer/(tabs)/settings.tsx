import { View, ScrollView } from 'react-native';
import React from 'react';
import { AppText } from '@/components/AppText';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import SideImageCard from '@/components/sideImageCard';
import HomeTile from '@/components/homeTile';
import { Background } from '@react-navigation/elements';

const Home = () => {
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#F6E0FF', '#F9FBFF', '#D2ECFE']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0.38, 0.63, 0.8]}
      />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        style={{ backgroundColor: '#ff0000' }}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileImage}>
            <Image
              source={require('@/assets/icons/GamifiedUserAvatarOPT.svg')}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
            />
          </View>
          <View style={styles.profileDetails}>
            <AppText variant="headline" emphasis="emphasized" color="accent">
              John Doe
            </AppText>
            <AppText variant="footnote" emphasis="emphasized" color="primary">
              Institute Of Mental Health
            </AppText>
            <View style={styles.levelText}>
              <AppText variant="caption1">Level: </AppText>
              <AppText variant="footnote" emphasis="emphasized">
                Basic
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.xpSection}>
          <LinearGradient
            colors={['#1D47DC', '#0E7FBC']}
            style={styles.xpBarContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.5]}
          >
            <View style={styles.xpText}>
              <AppText variant="footnote" emphasis="regular" color="secondary">
                Level 1
              </AppText>
              <View style={styles.xpAmount}>
                <AppText
                  variant="footnote"
                  emphasis="emphasized"
                  color="secondary"
                >
                  XP:
                </AppText>
                <AppText
                  variant="footnote"
                  emphasis="regular"
                  color="secondary"
                >
                  150/300
                </AppText>
              </View>
            </View>
            <View style={styles.xpBar}>
              <View style={styles.xpBarFill}></View>
            </View>
          </LinearGradient>
          <View style={styles.xpCardsContainer}>
            <View style={styles.card}>
              <View>
                <AppText variant="subhead" emphasis="emphasized">
                  Daily login
                </AppText>
              </View>

              <View style={styles.cardValue}>
                <Image
                  source={require('@/assets/images/fireIconOPT.webp')}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                />
                <AppText variant="title3" emphasis="emphasized">
                  03
                </AppText>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.Certificate}></View>
        <View style={styles.menuSection}></View>
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    paddingTop: rt.insets.top + theme.spacing.s6,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + theme.spacing.s5,
    paddingRight: rt.insets.right + theme.spacing.s5,
  },
  contentContainer: {
    gap: theme.spacing.s4,
    flex: 1,
  },
  background: {
    position: 'absolute',
    inset: 0,
  },
  profileCard: {
    backgroundColor: '#CDE2FF',
    flexDirection: 'row',
    padding: theme.spacing.s3,
    borderRadius: theme.radius.mdSoft,
    alignItems: 'center',
    gap: theme.spacing.s5,
  },
  xpSection: {
    flex: 1,
  },
  Certificate: {
    backgroundColor: '#00ffff',
    flex: 1,
  },
  menuSection: {
    backgroundColor: '#ff00ff',
    flex: 1,
  },
  profileImage: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.s3,
  },
  profileDetails: {
    alignContent: 'center',
    gap: theme.spacing.s2,
  },
  xpBarContainer: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.s3,
    paddingVertical: theme.spacing.s4,
  },
  xpCardsContainer: {
    backgroundColor: '#33ff57',
    flexDirection: 'row',
    flex: 1,
  },
  levelText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s1,
  },
  xpText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpAmount: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpBar: {
    height: 12,
    backgroundColor: theme.background.secondary,
    borderRadius: theme.radius.full,
    marginTop: theme.spacing.s2,
  },
  xpBarFill: {
    height: '100%',
    width: '50%',
    backgroundColor: '#36D367',
    borderRadius: theme.radius.full,
  },
  card: {
    backgroundColor: '#72BCF8',
    borderRadius: theme.radius.md,
    padding: theme.spacing.s3,
    width: '100%',
    height: 75,
  },
  cardValue: {
    flexDirection: 'row',
    gap: theme.spacing.s2,
    paddingVertical: theme.spacing.s1,
  },
}));
