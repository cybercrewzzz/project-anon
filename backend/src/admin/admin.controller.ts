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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { TakeActionDto } from './dto/take-action.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { FindReportsQueryDto } from './dto/find-reports-query.dto';
import { FindVolunteerApplicationsQueryDto } from './dto/find-volunteer-applications-query.dto';
import { FindAccountsQueryDto } from './dto/find-accounts-query.dto';
import { FindSessionsQueryDto } from './dto/find-sessions-query.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // TODO: Replace with real admin ID from JWT when auth is implemented.
  private adminId = '07e78a03-c194-4140-a73a-ba4a1cb57998';

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
  ) {
    return this.adminService.takeAction(
      reportId,
      this.adminId,
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

  @Patch('volunteer-applications/:requestId/approve')
  @HttpCode(200)
  approveVolunteerApplication(
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.adminService.approveVolunteerApplication(
      requestId,
      this.adminId,
    );
  }

  @Patch('volunteer-applications/:requestId/reject')
  @HttpCode(200)
  rejectVolunteerApplication(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() body: RejectApplicationDto,
  ) {
    return this.adminService.rejectVolunteerApplication(
      requestId,
      this.adminId,
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
  ) {
    return this.adminService.takeAccountAction(
      accountId,
      this.adminId,
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
