import { View, ActivityIndicator, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { SessionDetail } from '@/api/schemas';
import { LegendList } from '@legendapp/list';
import { StyleSheet } from 'react-native-unistyles';
import { Image } from 'expo-image';
import InputForm from '@/components/inputForm';
import { useAuth } from '@/store/useAuth';
import { getSocket, joinRoom, leaveRoom } from '@/api/socket';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
}

export default function Chat() {
  const { chat: chatId } = useLocalSearchParams() as {
    chat?: SessionDetail['sessionId'];
  };

  const account = useAuth(state => state.account);
  const userId = account?.accountId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    if (!chatId) return;

    const socket = getSocket();
    if (!socket) return;

    joinRoom(chatId);

    const onReceive = (payload: {
      encryptedPayload: string;
      clientMsgId: string;
      timestamp: number;
      senderId: string;
    }) => {
      setMessages(prev => [
        ...prev,
        {
          id: payload.clientMsgId,
          content: payload.encryptedPayload,
          senderId: payload.senderId,
          timestamp: payload.timestamp,
        },
      ]);
    };

    socket.on('message:receive', onReceive);

    return () => {
      socket.off('message:receive', onReceive);
      leaveRoom(chatId);
    };
  }, [chatId]);

  const sendMessage = () => {
    if (messageContent.trim() === '' || !chatId || !userId) return;

    const clientMsgId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const timestamp = Date.now();

    getSocket()?.emit('message:send', {
      sessionId: chatId,
      encryptedPayload: messageContent,
      clientMsgId,
      timestamp,
    });

    setMessages(prev => [
      ...prev,
      {
        id: clientMsgId,
        content: messageContent,
        senderId: userId,
        timestamp,
      },
    ]);

    setMessageContent('');
  };

  if (!chatId) {
    return <AppText>We couldn&apos;t find this chat room 🥲</AppText>;
  }

  return (
    <>
      <View style={styles.screen}>
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
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Image
              source={require('@/assets/images/profilePicture.webp')}
              style={styles.profilePicture}
            />
          </View>
          <View style={styles.headerDetails}>
            <View style={styles.nameContainer}>
              <AppText variant="callout" emphasis="emphasized">
                Nickname
              </AppText>
              <Image
                source={require('@/assets/icons/saveVolunteer.svg')}
                style={styles.saveVolunteer}
              />
            </View>
            <View style={styles.tagContainer}>
              <View style={styles.roleTag}>
                <AppText
                  variant="caption2"
                  emphasis="emphasized"
                  color="secondary"
                >
                  Volunteer
                </AppText>
              </View>
              <View style={styles.ratingTag}>
                <Image
                  source={require('@/assets/icons/ratingStar.svg')}
                  style={styles.ratingImage}
                  contentFit="contain"
                />
                <AppText variant="caption2" emphasis="emphasized">
                  4.5
                </AppText>
              </View>
            </View>
          </View>
          <View>
            <Image
              source={require('@/assets/icons/call.svg')}
              style={styles.call}
            />
          </View>
        </View>
        <LegendList
          style={styles.legendList}
          data={messages}
          renderItem={({ item }) => {
            const isSender = item.senderId === userId;
            return (
              <View
                style={[styles.userMessage, isSender && styles.senderMessage]}
              >
                <AppText>{item.content}</AppText>
              </View>
            );
          }}
          keyExtractor={item => item?.id ?? 'unknown'}
          contentContainerStyle={styles.contentContainer}
          recycleItems={true}
          initialScrollIndex={messages.length - 1}
          alignItemsAtEnd
          maintainScrollAtEnd
          maintainScrollAtEndThreshold={0.5}
          maintainVisibleContentPosition
          estimatedItemSize={100}
        />
        <View style={styles.inputContainer}>
          <InputForm
            placeholder="Type your message..."
            contentContainerStyle={styles.inputForm}
            value={messageContent}
            onChangeText={setMessageContent}
            multiline
            placeholderColor="primary"
          />
          <Pressable onPress={sendMessage} disabled={messageContent === ''}>
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
    paddingLeft: rt.insets.left + theme.spacing.s4,
    paddingRight: rt.insets.right + theme.spacing.s4,
    backgroundColor: theme.background.default,
  },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.s5,
    backgroundColor: '#EEF2FF',
    padding: theme.spacing.s3,
    borderRadius: theme.radius.full,
  },
  avatar: {
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  profilePicture: {
    width: 50,
    height: 50,
  },
  headerDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.s3,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
  },
  saveVolunteer: {
    width: 18,
    height: 18,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  roleTag: {
    backgroundColor: '#5039F6',
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s1 + theme.spacing.s3,
    borderRadius: theme.radius.full,
  },
  ratingTag: {
    backgroundColor: '#ffffff',
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s1 + theme.spacing.s3,
    borderRadius: theme.radius.full,
    gap: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingImage: {
    width: 12,
    height: 12,
  },
  call: {
    width: 50,
    height: 50,
  },
  legendList: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.s3,
  },
  userMessage: {
    padding: theme.spacing.s3,
    borderRadius: theme.spacing.s3,
    flexDirection: 'row',
  },
  senderMessage: {
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: theme.spacing.s4,
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: theme.spacing.s3,
    borderRadius: theme.radius.full,
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
