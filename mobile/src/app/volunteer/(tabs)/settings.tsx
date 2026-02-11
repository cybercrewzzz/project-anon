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
          <View style={styles.profileImage}></View>
          <View style={styles.profileDetails}></View>
        </View>
        <View style={styles.xpSection}>
          <View style={styles.expBarContainer}></View>
          <View style={styles.xpCardsContainer}></View>
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
    backgroundColor: '#fddb00',
    flexDirection: 'row',
    flex: 1,
  },
  xpSection: {
    backgroundColor: '#00ff0d',
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
    backgroundColor: '#0000ff',
    flex: 1,
  },
  profileDetails: {
    backgroundColor: '#af0ee0',
    flex: 1,
  },
  expBarContainer: {
    backgroundColor: '#ff5733',
    flex: 1,
  },
  xpCardsContainer: {
    backgroundColor: '#33ff57',
    flexDirection: 'row',
    flex: 1,
  },
}));
