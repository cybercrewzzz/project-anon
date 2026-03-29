import { View, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function Chat() {
  const router = useRouter();
  const { chat: chatId } = useLocalSearchParams() as {
    chat?: SessionDetail['sessionId'];
  };

  const account = useAuth(state => state.account);
  const userId = account?.accountId ?? '';

  const {
    messages,
    sendMessage,
    isEncryptionReady,
    isPeerConnected,
    isSessionEnded,
  } = useChat({ sessionId: chatId, userId });

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

  if (!chatId || !UUID_RE.test(chatId)) {
    return <AppText>We couldn&apos;t find this chat room 🥲</AppText>;
  }

  if (!userId) {
    return <AppText>Not authenticated</AppText>;
  }

  return (
    <>
      <View style={styles.screen}>
        <TimerBar
          sessionTime={SESSION_TIME_SECONDS}
          timeConsumed={timeConsumed}
        />
        <ChatScreenHeader
          name="RecAnonUser"
          profilePicture={require('@/assets/images/profilePictureUser.webp')}
          rating="4.7"
          roleTag="Rated"
        />

        {/* Peer disconnected banner */}
        {!isPeerConnected && !isSessionEnded && (
          <View style={styles.peerDisconnectedBanner}>
            <AppText variant="caption2" color="secondary">
              User disconnected — waiting for them to reconnect…
            </AppText>
          </View>
        )}

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
            disabled={
              messageContent.trim() === '' ||
              !isEncryptionReady ||
              isSessionEnded
            }
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

        {/* Session ended overlay — rendered on top of everything */}
        {isSessionEnded && (
          <View style={styles.sessionEndedOverlay}>
            <AppText variant="title2" style={styles.sessionEndedTitle}>
              Session Ended
            </AppText>
            <AppText variant="body" style={styles.sessionEndedBody}>
              Your chat session has ended. Everything shared here remains
              private and confidential.
            </AppText>
            <Pressable
              onPress={() =>
                router.replace({
                  pathname: '/volunteer/rate/rateSession' as never,
                  params: { sessionId: chatId, isSeeker: 'false' },
                })
              }
              style={styles.rateButton}
            >
              <AppText variant="body" color="secondary" emphasis="emphasized">
                Rate Your Experience
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/volunteer/(tabs)/home' as never)}
            >
              <AppText variant="caption1" color="accent">
                Skip
              </AppText>
            </Pressable>
          </View>
        )}
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
    backgroundColor: theme.surface.chatSurface,
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
  peerDisconnectedBanner: {
    backgroundColor: theme.state.warning,
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    alignItems: 'center',
  },
  sessionEndedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s6,
    gap: theme.spacing.s4,
  },
  sessionEndedTitle: {
    textAlign: 'center',
  },
  sessionEndedBody: {
    textAlign: 'center',
    opacity: 0.7,
  },
  closeButton: {
    marginTop: theme.spacing.s4,
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    backgroundColor: theme.action.secondary,
    borderRadius: theme.radius.full,
  },
  rateButton: {
    marginTop: theme.spacing.s4,
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    backgroundColor: '#6A00F4',
    borderRadius: theme.radius.full,
  },
}));
