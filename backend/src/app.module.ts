import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { VolunteerModule } from './volunteer/volunteer.module';
import { LookupModule } from './lookup/lookup.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    AdminModule,
    AuthModule,
    RedisModule,
    ChatModule,
    VolunteerModule,
    LookupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
