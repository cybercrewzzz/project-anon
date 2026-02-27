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

      <View style={styles.emotionCard}>
        <AppText
          variant="body"
          emphasis="emphasized"
          style={styles.emotionCardText}
        >
          {' '}
          How are you feeling Right Now?{' '}
        </AppText>
        <View style={styles.emojeeContainer}>
          <Image
            source={require('@/assets/icons/face-em1.svg')}
            style={{ width: 35, height: 35 }}
          ></Image>
          <Image
            source={require('@/assets/icons/face-em2.svg')}
            style={{ width: 35, height: 35 }}
          ></Image>
          <Image
            source={require('@/assets/icons/face-em3.svg')}
            style={{ width: 35, height: 35 }}
          ></Image>
          <Image
            source={require('@/assets/icons/face-em4.svg')}
            style={{ width: 35, height: 35 }}
          ></Image>
          <Image
            source={require('@/assets/icons/face-em5.svg')}
            style={{ width: 35, height: 35 }}
          ></Image>
        </View>
      </View>

      <View style={styles.categoryCard}>
        <AppText
          variant="body"
          emphasis="emphasized"
          style={styles.emotionCardText}
        >
          {' '}
          What is troubling you today?{' '}
        </AppText>
        <View style={styles.categoryType}>
          <AppText
            variant="body"
            emphasis="emphasized"
            style={styles.categoryTypeText}
          >
            {' '}
            Family Problem{' '}
          </AppText>
          <Image
            source={require('@/assets/icons/chevron-downOPT.svg')}
            style={styles.dropDownIcon}
          ></Image>
        </View>
        <View style={styles.fellingDescriptionContainer}>
          <AppText
            variant="body"
            emphasis="emphasized"
            style={styles.emotionCardText}
          >
            {' '}
            What Best Describes this Feeling?{' '}
          </AppText>

          <View style={styles.descriptionCardContainer}>
            <View style={styles.pointCard}>
              <AppText
                variant="caption1"
                emphasis="emphasized"
                style={styles.pointText}
              >
                Anxiety
              </AppText>
            </View>
            <View style={styles.pointCard}>
              <AppText
                variant="caption1"
                emphasis="emphasized"
                style={styles.pointText}
              >
                Stress
              </AppText>
            </View>
            <View style={styles.pointCard}>
              <AppText
                variant="caption1"
                emphasis="emphasized"
                style={styles.pointText}
              >
                Depression
              </AppText>
            </View>
            <View style={styles.pointCard}>
              <Image
                source={require('@/assets/icons/plusIconOPT.svg')}
                style={{ width: 17, height: 16 }}
              ></Image>
            </View>
          </View>
        </View>
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
  emotionCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s4,
    marginTop: 20,
  },
  emotionCardText: {
    color: theme.text.subtle1,
    margin: 5,
  },
  emojeeContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 32,
    padding: 4,
  },
  categoryCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s4,
    marginTop: 20,
  },
  categoryType: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: theme.surface.secondary,
    borderColor: theme.text.subtle2,
    borderWidth: 2,
    borderRadius: theme.radius.md,
  },
  categoryTypeText: {
    color: theme.text.primary,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dropDownIcon: {
    width: 16,
    height: 14,
    alignSelf: 'center',
    marginRight: 8,
    marginLeft: 'auto',
  },
  fellingDescriptionContainer: {
    marginTop: 10,
    backgroundColor: theme.surface.secondary,
    borderColor: theme.text.subtle2,
    borderWidth: 2,
    borderRadius: theme.radius.md,
  },
  descriptionCardContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 16,
    padding: 10,
  },
}));
