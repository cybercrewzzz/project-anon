import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VolunteerModule } from './volunteer/volunteer.module';
import { LookupModule } from './lookup/lookup.module';

@Module({
  imports: [VolunteerModule, LookupModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
