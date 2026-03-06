import { Controller, UseGuards, Get } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { VolunteerService } from './volunteer.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('volunteer')
@UseGuards(AuthGuard, RolesGuard)
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  // GET /volunteer/profile

  @Get('profile')
  @Roles('volunteer')
  async getProfile(@CurrentUser() user: { sub: string }) {
    return this.volunteerService.getProfile(user.sub);
  }
}
