import { Module } from '@nestjs/common';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';

@Module({
  imports: [],
  controllers: [VolunteerController],
  providers: [VolunteerService],
})
export class VolunteerModule {}
