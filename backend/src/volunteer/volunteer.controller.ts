import {
  Controller,
  UseGuards,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { VolunteerService } from './volunteer.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { UpdateStatusDTO } from './dto/update-status.dto';
import { ApplyVolunteerDTO } from './dto/apply-volunteer.dto';

@Controller('volunteer')
@UseGuards(AuthGuard, RolesGuard)
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}



  // GET /volunteer/profile
  @Get('profile')
  @Roles('volunteer')
  getProfile(@CurrentUser() user: { sub: string }) {
    return this.volunteerService.getProfile(user.sub);
  }

  // PATCH /volunteer/profile

  @Patch('profile')
  @Roles('volunteer')
  updateProfile(
    @CurrentUser() user: { sub: string },
    @Body() body: UpdateProfileDTO,
  ) {
    return this.volunteerService.updateProfile(user.sub, body);
  }

  // PATCH /volunteer/status

  @Patch('status')
  @Roles('volunteer')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @CurrentUser() user: { sub: string },
    @Body() body: UpdateStatusDTO,
  ) {
    return this.volunteerService.updateStatus(user.sub, body);
  }
}

// POST /volunteer/apply

  @Post('apply')
  @Roles('user')
  @HttpCode(HttpStatus.CREATED)
  applyAsVolunteer(
    @CurrentUser() user: { sub: string },
    @Body() body: ApplyVolunteerDTO,
  ) {
    return this.volunteerService.applyAsVolunteer(user.sub, body);
  }
