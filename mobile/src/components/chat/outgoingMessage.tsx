import { View } from 'react-native';
import { AppText } from '../AppText';
import formatMessageTime from '@/utils/formatMessageTime';
import { StyleSheet } from 'react-native-unistyles';

interface OutgoingMessageProps {
  content: string;
  timestamp: number;
}

export default function OutgoingMessage({
  content,
  timestamp,
}: OutgoingMessageProps) {
  return (
    <View style={styles.outgoingMessage}>
      <AppText variant="subhead">{content}</AppText>
      <View style={styles.messageTime}>
        <AppText variant="caption2" textAlign="right" color="gray">
          {formatMessageTime(timestamp)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  outgoingMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#F3F4F6',
    padding: theme.spacing.s3,
    marginVertical: theme.spacing.s1,
    borderRadius: 17,
    borderTopEndRadius: 4,
  },
  messageTime: {
    paddingTop: theme.spacing.s2,
  },
}));
