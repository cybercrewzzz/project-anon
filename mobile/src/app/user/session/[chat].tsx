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
import { getSocket, joinRoom, leaveRoom } from '@/api/socket';
import * as Crypto from 'expo-crypto';
import TimerBar from '@/components/timerBar';
import ChatScreenHeader from '@/components/chatScreenHeader';

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

    const clientMsgId = Crypto.randomUUID();
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
        <TimerBar />
        <ChatScreenHeader />
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
