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

  // POST /volunteer/apply

  @Post('apply')
  @Roles('user')

  // @HttpCode sets the success response code to 201 Created.
  @HttpCode(HttpStatus.CREATED)
  async applyAsVolunteer(
    @CurrentUser() user: { sub: string },
    @Body() dto: ApplyVolunteerDTO,
  ) {
    return this.volunteerService.applyAsVolunteer(user.sub, dto);
  }

  // GET /volunteer/profile
  @Get('profile')
  @Roles('volunteer')
  async getProfile(@CurrentUser() user: { sub: string }) {
    return this.volunteerService.getProfile(user.sub);
  }

  // PATCH /volunteer/profile

  @Patch('profile')
  @Roles('volunteer')
  async updateProfile(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateProfileDTO,
  ) {
    return this.volunteerService.updateProfile(user.sub, dto);
  }

  // PATCH /volunteer/status

  @Patch('status')
  @Roles('volunteer')
  async updateStatus(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateStatusDTO,
  ) {
    return this.volunteerService.updateStatus(user.sub, dto);
  }
}
