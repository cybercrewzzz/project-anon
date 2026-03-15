import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module.js';
import { ChatGateway, RECONNECT_QUEUE } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { ChatServerService } from './chat-server.service.js';
import { ChatProcessor } from './chat.processor.js';

@Module({
  imports: [
    ConfigModule,
    // Exports JwtModule so JwtService is available in this module
    AuthModule,
    // Register the reconnect-expire queue (global BullMQ root is in AppModule)
    BullModule.registerQueue({ name: RECONNECT_QUEUE }),
  ],
  providers: [ChatGateway, ChatService, ChatServerService, ChatProcessor],
})
export class ChatModule {}
