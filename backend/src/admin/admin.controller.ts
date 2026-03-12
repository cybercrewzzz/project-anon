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
import { ReportStatus, VerificationStatus } from 'src/generated/prisma/client';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  private adminId = '07e78a03-c194-4140-a73a-ba4a1cb57998';

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
  findReport(@Param('reportId') reportId: string) {
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
  dismissReport(@Param('reportId') reportId: string) {
    return this.adminService.dismissReport(reportId);
  }

  @Get('volunteer-applications')
  volunteerApplications(
    @Query('status') status?: VerificationStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.volunteerApplications(
      status,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
