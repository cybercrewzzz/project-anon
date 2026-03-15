import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { TakeActionDto } from './dto/take-action.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { FindReportsQueryDto } from './dto/find-reports-query.dto';
import { FindVolunteerApplicationsQueryDto } from './dto/find-volunteer-applications-query.dto';
import { FindAccountsQueryDto } from './dto/find-accounts-query.dto';
import { FindSessionsQueryDto } from './dto/find-sessions-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Reports ─────────────────────────────────────────────────────

  @Get('reports')
  findAllReports(@Query() query: FindReportsQueryDto) {
    return this.adminService.findAllReports(
      query.status,
      query.page,
      query.limit,
    );
  }

  @Get('reports/:reportId')
  findReport(@Param('reportId', ParseUUIDPipe) reportId: string) {
    return this.adminService.findReport(reportId);
  }

  @Post('reports/:reportId/action')
  takeAction(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() body: TakeActionDto,
    @CurrentUser('accountId') adminId: string,
  ) {
    return this.adminService.takeAction(
      reportId,
      adminId,
      body.actionType,
      body.reason,
      body.expiresAt,
    );
  }

  @Patch('reports/:reportId/dismiss')
  @HttpCode(200)
  dismissReport(@Param('reportId', ParseUUIDPipe) reportId: string) {
    return this.adminService.dismissReport(reportId);
  }

  // ── Volunteer Applications ──────────────────────────────────────

  @Get('volunteer-applications')
  getVolunteerApplications(@Query() query: FindVolunteerApplicationsQueryDto) {
    return this.adminService.getVolunteerApplications(
      query.status,
      query.page,
      query.limit,
    );
  }

  @Get('volunteer-applications/:requestId')
  getVolunteerApplication(
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.adminService.getVolunteerApplication(requestId);
  }

  @Patch('volunteer-applications/:requestId/approve')
  @HttpCode(200)
  approveVolunteerApplication(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser('accountId') adminId: string,
  ) {
    return this.adminService.approveVolunteerApplication(requestId, adminId);
  }

  @Patch('volunteer-applications/:requestId/reject')
  @HttpCode(200)
  rejectVolunteerApplication(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() body: RejectApplicationDto,
    @CurrentUser('accountId') adminId: string,
  ) {
    return this.adminService.rejectVolunteerApplication(
      requestId,
      adminId,
      body.adminNotes,
    );
  }

  // ── Accounts ────────────────────────────────────────────────────

  @Get('accounts')
  findAllAccounts(@Query() query: FindAccountsQueryDto) {
    return this.adminService.findAllAccounts(
      query.search,
      query.role,
      query.status,
      query.page,
      query.limit,
    );
  }

  @Get('accounts/:accountId')
  findAccount(@Param('accountId', ParseUUIDPipe) accountId: string) {
    return this.adminService.findAccount(accountId);
  }

  @Post('accounts/:accountId/action')
  takeAccountAction(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() body: TakeActionDto,
    @CurrentUser('accountId') adminId: string,
  ) {
    return this.adminService.takeAccountAction(
      accountId,
      adminId,
      body.actionType,
      body.reason,
      body.expiresAt,
    );
  }

  // ── Sessions ────────────────────────────────────────────────────

  @Get('sessions')
  findAllSessions(@Query() query: FindSessionsQueryDto) {
    return this.adminService.findAllSessions(
      query.status,
      query.seekerId,
      query.listenerId,
      query.page,
      query.limit,
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
