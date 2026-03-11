import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '../AppText';
import { Image } from 'expo-image';
import formatTime from '@/utils/formatTime';

interface TimerBarProps {
  sessionTime: number;
  timeConsumed: number;
}

export default function TimerBar({ sessionTime, timeConsumed }: TimerBarProps) {
  const safeSessionTime = sessionTime > 0 ? sessionTime : 1;
  const rawPercentage = (timeConsumed / safeSessionTime) * 100;
  const percentage = Math.min(Math.max(rawPercentage, 0), 100);

  return (
    <View style={styles.timerContainer}>
      <AppText variant="footnote" emphasis="emphasized">
        {formatTime(timeConsumed)}
      </AppText>
      <View style={styles.timerBar}>
        <View style={styles.timeConsumed(percentage)} />
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
    marginHorizontal: theme.spacing.s6,
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
  timeConsumed: (percentage: number) => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#F39C12',
    width: `${percentage}%`,
    borderRadius: theme.radius.full,
  }),
  endSession: {
    width: 20,
    height: 20,
  },
}));
