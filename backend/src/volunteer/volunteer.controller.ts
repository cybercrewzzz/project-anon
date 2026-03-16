import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { UpdateStatusDTO } from './dto/update-status.dto';
import { ApplyVolunteerDTO } from './dto/apply-volunteer.dto';

@Controller('volunteer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  // ── GET /volunteer/profile ───────────────────────────────────────

  @Get('profile')
  @Roles('volunteer')
  getProfile(@CurrentUser('accountId') accountId: string) {
    return this.volunteerService.getProfile(accountId);
  }

  // ── PATCH /volunteer/profile ─────────────────────────────────────

  @Patch('profile')
  @Roles('volunteer')
  updateProfile(
    @CurrentUser('accountId') accountId: string,
    @Body() body: UpdateProfileDTO,
  ) {
    return this.volunteerService.updateProfile(accountId, body);
  }

  // ── PATCH /volunteer/status ──────────────────────────────────────

  @Patch('status')
  @Roles('volunteer')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @CurrentUser('accountId') accountId: string,
    @Body() body: UpdateStatusDTO,
  ) {
    return this.volunteerService.updateStatus(accountId, body);
  }

  // ── POST /volunteer/apply ────────────────────────────────────────

  @Post('apply')
  @Roles('user')
  @HttpCode(HttpStatus.CREATED)
  applyAsVolunteer(
    @CurrentUser('accountId') accountId: string,
    @Body() body: ApplyVolunteerDTO,
  ) {
    return this.volunteerService.applyAsVolunteer(accountId, body);
  }
}
