import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';

const P2P_P2V_withCategory = () => {
  return (
    <View style={styles.container}>
      <View style={styles.screenTitle}>
        <AppText variant="headline">Peer to Peer</AppText>
      </View>
      <View style={styles.smallCardContainer}>
        <View style={styles.pointCard}>
          <Image
            source={require('@/assets/icons/pointsStar.svg')}
            style={{ width: 25, height: 25 }}
          ></Image>
          <AppText
            variant="body"
            emphasis="emphasized"
            style={styles.pointText}
          >
            185{' '}
          </AppText>
        </View>
        <View style={styles.ticketCard}>
          <Image
            source={require('@/assets/icons/ticket.svg')}
            style={{ width: 25, height: 25 }}
          ></Image>
          <AppText
            variant="body"
            emphasis="emphasized"
            style={styles.ticketText}
          >
            {' '}
            5{' '}
          </AppText>
        </View>
          </View>

          <View >

          </View>
    </View>
  );
};

export default P2P_P2V_withCategory;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.surface.secondary,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
  },
  screenTitle: {
    alignItems: 'center',
    marginTop: 20,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  smallCardContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  pointText: {
    color: theme.text.secondary,
  },
  ticketText: {
    color: theme.text.accent,
    paddingHorizontal: 5,
  },
}));
