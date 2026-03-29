import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { VolunteerModule } from './volunteer/volunteer.module';
import { LookupModule } from './lookup/lookup.module';
import { SessionModule } from './session/session.module';
import { AccountModule } from './account/account.module';
import { DeviceModule } from './device/device.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // BullMQ global connection — all feature queues share this Redis pool
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
        },
      }),
    }),
    PrismaModule,
    AdminModule,
    AuthModule,
    RedisModule,
    ChatModule,
    VolunteerModule,
    LookupModule,
    SessionModule,
    AccountModule,
    DeviceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
