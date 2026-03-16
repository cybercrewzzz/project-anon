import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { RolesGuard } from '../accounts/guards/roles.guard';
import { Roles } from '../accounts/decorators/roles.decorator';
import { CurrentUser } from '../accounts/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * POST /report
   * File a report against the other session participant.
   * Roles: user or volunteer
   */
  @Post()
  @Roles('user', 'volunteer')
  @HttpCode(HttpStatus.CREATED)
  async createReport(
    @CurrentUser('accountId') accountId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(accountId, dto);
  }
}