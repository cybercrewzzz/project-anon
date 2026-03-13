import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { UpdateStatusDTO } from './dto/update-status.dto';
import { ApplyVolunteerDTO } from './dto/apply-volunteer.dto';

@Controller('volunteer')
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  // TODO: Replace with real account ID from JWT when auth is implemented.
  private readonly accountId = '07e78a03-c194-4140-a73a-ba4a1cb57998';

  // GET /volunteer/profile
  @Get('profile')
  getProfile() {
    return this.volunteerService.getProfile(this.accountId);
  }

  // PATCH /volunteer/profile
  @Patch('profile')
  updateProfile(@Body() body: UpdateProfileDTO) {
    return this.volunteerService.updateProfile(this.accountId, body);
  }

  // PATCH /volunteer/status
  @Patch('status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Body() body: UpdateStatusDTO) {
    return this.volunteerService.updateStatus(this.accountId, body);
  }

  // POST /volunteer/apply
  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  applyAsVolunteer(@Body() body: ApplyVolunteerDTO) {
    return this.volunteerService.applyAsVolunteer(this.accountId, body);
  }
}
