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
import {
  AccountStatus,
  ReportStatus,
  SessionStatus,
  VerificationStatus,
} from 'src/generated/prisma/client';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // TODO: Replace with real admin ID from JWT when auth is implemented.
  private adminId = '07e78a03-c194-4140-a73a-ba4a1cb57998';

  // ── Reports ─────────────────────────────────────────────────────

  @Get('reports')
  findAllReports(
    @Query('status') status?: ReportStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.findAllReports(
      status,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
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
  getVolunteerApplications(
    @Query('status') status?: VerificationStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getVolunteerApplications(
      status,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
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
  findAllAccounts(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: AccountStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.findAllAccounts(
      search,
      role,
      status,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
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
  findAllSessions(
    @Query('status') status?: SessionStatus,
    @Query('seekerId') seekerId?: string,
    @Query('listenerId') listenerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.findAllSessions(
      status,
      seekerId,
      listenerId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
