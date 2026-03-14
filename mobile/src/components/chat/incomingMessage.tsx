import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '../AppText';
import formatMessageTime from '@/utils/formatMessageTime';

interface IncomingMessageProps {
  content: string;
  timestamp: number;
}

export default function IncomingMessage({
  content,
  timestamp,
}: IncomingMessageProps) {
  return (
    <View style={styles.incomingMessage}>
      <AppText variant="subhead" color="secondary">
        {content}
      </AppText>
      <View style={styles.messageTime}>
        <AppText variant="caption2" textAlign="right" color="secondary">
          {formatMessageTime(timestamp)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  incomingMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.surface.chatBubbleIncoming,
    padding: theme.spacing.s3,
    marginVertical: theme.spacing.s1,
    borderRadius: theme.radius.messageBubble,
    borderTopStartRadius: theme.radius.messageBubbleTail,
  },
  messageTime: {
    paddingTop: theme.spacing.s2,
  },
}));
