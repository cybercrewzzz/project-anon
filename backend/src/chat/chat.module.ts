import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module.js';
import {
  ChatGateway,
  RECONNECT_QUEUE,
  SESSION_TIMEOUT_QUEUE,
} from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { ChatServerService } from './chat-server.service.js';
import { ChatProcessor, ChatTimeoutProcessor } from './chat.processor.js';

@Module({
  imports: [
    ConfigModule,
    // Exports JwtModule so JwtService is available in this module
    AuthModule,
    // Both queues reference the global BullMQ root registered in AppModule
    BullModule.registerQueue({ name: RECONNECT_QUEUE }),
    BullModule.registerQueue({ name: SESSION_TIMEOUT_QUEUE }),
  ],
  providers: [
    ChatGateway,
    ChatService,
    ChatServerService,
    ChatProcessor,
    ChatTimeoutProcessor,
  ],
  exports: [
    // Exported so SessionModule can emit session:matched to seekers
    // after a volunteer accepts a Path B session.
    ChatServerService,
  ],
})
export class ChatModule {}
