import { View, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { SessionDetail } from '@/api/schemas';
import { LegendList } from '@legendapp/list';
import { StyleSheet } from 'react-native-unistyles';
import { Image } from 'expo-image';
import InputForm from '@/components/inputForm';
import { useAuth } from '@/store/useAuth';
import TimerBar from '@/components/chat/timerBar';
import ChatScreenHeader from '@/components/chat/chatScreenHeader';
import OutgoingMessage from '@/components/chat/outgoingMessage';
import IncomingMessage from '@/components/chat/incomingMessage';
import { useChat } from '@/hooks/useChat';

const SESSION_TIME_SECONDS = 1800;

export default function Chat() {
  const { chat: chatId } = useLocalSearchParams() as {
    chat?: SessionDetail['sessionId'];
  };

  const account = useAuth(state => state.account);
  // TODO: Remove mock ID when auth is implemented.
  const userId = account?.accountId || 'f3430b6a-7fde-4777-868b-fb6fffb813ac';

  const { messages, sendMessage, isEncryptionReady } = useChat({
    sessionId: chatId,
    userId,
  });

  const [messageContent, setMessageContent] = useState('');

  const handleSend = () => {
    if (messageContent.trim() === '') return;
    sendMessage(messageContent);
    setMessageContent('');
  };

  // Timer Handler
  const [timeConsumed, setTimeConsumed] = useState(0);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeConsumed(prevTime => {
        if (prevTime >= SESSION_TIME_SECONDS) {
          clearInterval(timerInterval);
          return SESSION_TIME_SECONDS;
        }
        return prevTime + 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  if (!chatId) {
    return <AppText>We couldn&apos;t find this chat room 🥲</AppText>;
  }

  return (
    <>
      <View style={styles.screen}>
        <TimerBar
          sessionTime={SESSION_TIME_SECONDS}
          timeConsumed={timeConsumed}
        />
        <ChatScreenHeader
          name="Nickname"
          profilePicture={require('@/assets/images/profilePicture.webp')}
          rating="4.5"
          roleTag="Volunteer"
        />
        <LegendList
          data={messages}
          renderItem={({ item }) => {
            const isSender = item.senderId === userId;
            return isSender ?
                <OutgoingMessage
                  content={item.content}
                  timestamp={item.timestamp}
                />
              : <IncomingMessage
                  content={item.content}
                  timestamp={item.timestamp}
                />;
          }}
          keyExtractor={item => item?.id ?? 'unknown'}
          contentContainerStyle={styles.contentContainer}
          recycleItems={true}
          initialScrollIndex={
            messages.length > 0 ? messages.length - 1 : undefined
          }
          alignItemsAtEnd
          maintainScrollAtEnd
          maintainScrollAtEndThreshold={0.5}
          maintainVisibleContentPosition
          estimatedItemSize={100}
        />
        <View style={styles.inputContainer}>
          <InputForm
            placeholder={
              isEncryptionReady ?
                'Type your message...'
              : 'Establishing secure connection...'
            }
            contentContainerStyle={styles.inputForm}
            value={messageContent}
            onChangeText={setMessageContent}
            multiline
            numberOfLines={5}
            placeholderColor="primary"
          />
          <Pressable
            onPress={handleSend}
            disabled={messageContent === '' || !isEncryptionReady}
          >
            <Image
              source={require('@/assets/icons/userSend.svg')}
              style={styles.sendButton}
            />
          </Pressable>
        </View>
        <View style={styles.footerNote}>
          <AppText variant="caption2">
            Your messages are anonymous and confidential
          </AppText>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    paddingTop: rt.insets.top + theme.spacing.s4,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left,
    paddingRight: rt.insets.right,
    backgroundColor: theme.background.default,
  },
  contentContainer: {
    paddingVertical: theme.spacing.s3,
    marginHorizontal: theme.spacing.s3 + theme.spacing.s2,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: theme.spacing.s4,
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: theme.spacing.s3,
    borderRadius: theme.radius.full,
    marginHorizontal: theme.spacing.s4,
  },
  inputForm: {
    flex: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
  },
  footerNote: {
    alignItems: 'center',
    margin: theme.spacing.s2,
  },
}));
