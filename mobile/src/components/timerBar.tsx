import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from './AppText';
import { Image } from 'expo-image';

export default function TimerBar() {
  return (
    <View style={styles.timerContainer}>
      <AppText variant="footnote" emphasis="emphasized">
        09:34
      </AppText>
      <View style={styles.timerBar}>
        <View style={styles.timeConsumed} />
      </View>
      <Image
        source={require('@/assets/icons/endSession.svg')}
        style={styles.endSession}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.s4,
    marginHorizontal: theme.spacing.s4,
    marginBottom: theme.spacing.s3,
  },
  timerBar: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    height: theme.spacing.s3,
    borderRadius: theme.radius.full,
    position: 'relative',
    overflow: 'hidden',
  },
  timeConsumed: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#F39C12',
    width: '31%',
    borderRadius: theme.radius.full,
  },
  endSession: {
    width: 20,
    height: 20,
  },
}));
