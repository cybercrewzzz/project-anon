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
    const { userId, sessionId } = client.handshake.query;

    if (userId && sessionId) {
      await client.join(sessionId as string);
      console.log(`[Connected] ${userId} Joined session: ${sessionId}`);
    } else {
      console.log(`[Rejected] Connection missing userId or sessionId`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const { userId } = client.handshake.query;
    console.log(`[Disconnected] ${userId} left.`);
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
