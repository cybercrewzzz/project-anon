import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  async handleConnection(client: Socket) {
    const { userId } = client.handshake.query;

    if (!userId) {
      console.log('[Rejected] Connection missing userId');
      client.disconnect();
      return;
    }

    console.log(`[Connected] ${userId}`);
  }

  handleDisconnect(client: Socket) {
    const { userId } = client.handshake.query;
    console.log(`[Disconnected] ${userId} left.`);
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(
    @MessageBody() payload: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(payload.sessionId);
    const { userId } = client.handshake.query;
    console.log(`[Room] ${userId} joined session: ${payload.sessionId}`);
    return { sessionId: payload.sessionId, status: 'joined' };
  }

  @SubscribeMessage('room:leave')
  async handleRoomLeave(
    @MessageBody() payload: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(payload.sessionId);
    const { userId } = client.handshake.query;
    console.log(`[Room] ${userId} left session: ${payload.sessionId}`);
    return { sessionId: payload.sessionId, status: 'left' };
  }

  @SubscribeMessage('message:send')
  handleIncomingMessage(
    @MessageBody()
    payload: {
      sessionId: string;
      encryptedPayload: string;
      clientMsgId: string;
      timestamp: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Message received for room ${payload.sessionId}`);

    client.to(payload.sessionId).emit('message:receive', {
      ...payload,
      senderId: client.handshake.query.userId,
    });

    return {
      clientMsgId: payload.clientMsgId,
      status: 'sent',
    };
  }
}
