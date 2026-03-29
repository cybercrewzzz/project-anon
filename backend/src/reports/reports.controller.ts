import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportSchema } from './dto/create-report.dto';
import type { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS CONTROLLER
//
// Exposes the POST /report endpoint for users and volunteers to submit
// abuse reports tied to a specific chat session.
//
// Auth: Bearer JWT required. Both 'user' and 'volunteer' roles are permitted.
// ─────────────────────────────────────────────────────────────────────────────

@Controller('report')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ─── POST /report ──────────────────────────────────────────────────────
  //
  // Submit an abuse report for a session. The reporter's identity is
  // extracted from the JWT — they don't need to provide it in the body.
  //
  // Returns 201 Created with the new report's ID.

  @Post()
  @Roles('user', 'volunteer')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('accountId') reporterId: string,
    @Body(new ZodValidationPipe(CreateReportSchema)) dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(reporterId, dto);
  }
}
