import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  // ── Connection Lifecycle ────────────────────────────────────────

  async handleConnection(client: Socket) {
    // ── Authentication Hook Point ──
    // Currently: read userId from handshake query (no JWT).
    // TODO: When auth is implemented, replace with:
    //   const userId = await this.authService.validateToken(client.handshake.auth.token);
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      console.log('[Rejected] Connection missing userId');
      client.disconnect();
      return;
    }

    await this.chatService.mapSocket(client.id, userId);
    console.log(`[Connected] ${userId} (socket: ${client.id})`);
  }

  async handleDisconnect(client: Socket) {
    const userId = await this.chatService.getUserIdBySocket(client.id);
    await this.chatService.unmapSocket(client.id);
    console.log(`[Disconnected] ${userId ?? 'unknown'} left.`);
  }

  // ── Room Management ─────────────────────────────────────────────

  @SubscribeMessage('room:join')
  async handleRoomJoin(
    @MessageBody() payload: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = await this.chatService.getUserIdBySocket(client.id);
    if (!userId) return { status: 'error', message: 'Not authenticated' };

    const isValid = await this.chatService.validateSession(
      payload.sessionId,
      userId,
    );
    if (!isValid) return { status: 'error', message: 'Invalid session' };

    await client.join(payload.sessionId);
    console.log(`[Room] ${userId} joined session: ${payload.sessionId}`);

    // Send stored public keys to the joining client so late joiners
    // can immediately derive the shared secret.
    const storedKeys = await this.chatService.getStoredKeys(payload.sessionId);
    for (const [keyUserId, publicKey] of Object.entries(storedKeys)) {
      if (keyUserId !== userId) {
        client.emit('key:exchange', {
          sessionId: payload.sessionId,
          userId: keyUserId,
          publicKey,
        });
      }
    }

    return { sessionId: payload.sessionId, status: 'joined' };
  }

  @SubscribeMessage('room:leave')
  async handleRoomLeave(
    @MessageBody() payload: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(payload.sessionId);
    const userId = await this.chatService.getUserIdBySocket(client.id);
    console.log(`[Room] ${userId} left session: ${payload.sessionId}`);
    return { sessionId: payload.sessionId, status: 'left' };
  }

  // ── E2EE Key Exchange ───────────────────────────────────────────

  @SubscribeMessage('key:exchange')
  async handleKeyExchange(
    @MessageBody() payload: { sessionId: string; publicKey: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = await this.chatService.getUserIdBySocket(client.id);
    if (!userId) return { status: 'error' };

    // Store the key so late joiners can retrieve it via room:join
    await this.chatService.storePublicKey(
      payload.sessionId,
      userId,
      payload.publicKey,
    );

    // Relay to all other participants in the room
    client.to(payload.sessionId).emit('key:exchange', {
      sessionId: payload.sessionId,
      userId,
      publicKey: payload.publicKey,
    });

    console.log(
      `[Key] ${userId} exchanged key for session: ${payload.sessionId}`,
    );
    return { status: 'ok' };
  }

  // ── Messaging ───────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleIncomingMessage(
    @MessageBody()
    payload: {
      sessionId: string;
      encryptedPayload: string;
      clientMsgId: string;
      timestamp: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = await this.chatService.getUserIdBySocket(client.id);
    if (!userId) return { status: 'error' };

    const message = {
      ...payload,
      senderId: userId,
    };

    // Buffer in Redis for reconnection recovery
    const msgIndex = await this.chatService.bufferMessage(
      payload.sessionId,
      message,
    );

    // Relay to room (excluding sender)
    client.to(payload.sessionId).emit('message:receive', {
      ...message,
      msgIndex,
    });

    return {
      clientMsgId: payload.clientMsgId,
      status: 'sent',
      msgIndex,
    };
  }

  // ── Reconnection Sync ──────────────────────────────────────────

  @SubscribeMessage('message:sync')
  async handleMessageSync(
    @MessageBody() payload: { sessionId: string; lastMsgIndex: number },
  ) {
    const messages = await this.chatService.getMessages(
      payload.sessionId,
      payload.lastMsgIndex,
    );
    return { sessionId: payload.sessionId, messages };
  }
}
