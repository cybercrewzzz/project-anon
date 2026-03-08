import { MessageBody, SubscribeMessage } from '@nestjs/websockets';

export class ChatGateway {
  @SubscribeMessage('chat')
  handleChat(@MessageBody('id') id: number): number {
    return id;
  }
}
