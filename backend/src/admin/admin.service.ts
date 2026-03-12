import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ActionType,
  ReportStatus,
  VerificationStatus,
} from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllReports(status?: ReportStatus, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportedAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findReport(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { reportId: reportId },
      include: {
        session: {
          select: {
            closedReason: true,
            problem: {
              select: {
                problemId: true,
                customCategoryLabel: true,
                feelingLevel: true,
                status: true,
                createdAt: true,
              },
            },
            starredByUser: true,
            startedAt: true,
            status: true,
            userRating: true,
            volunteerRating: true,
          },
        },
        reporter: {
          select: {
            accountId: true,
            name: true,
            email: true,
          },
        },
        reported: {
          select: {
            accountId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    return report;
  }

  async takeAction(
    reportId: string,
    adminId: string,
    actionType: ActionType,
    reason: string,
    expiresAt?: string,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { reportId },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const statusMap: Partial<Record<ActionType, 'suspended' | 'banned'>> = {
      suspend: 'suspended',
      ban: 'banned',
    };

    const [action] = await this.prisma.$transaction([
      this.prisma.accountAction.create({
        data: {
          accountId: report.reportedId,
          adminId,
          reportId,
          actionType,
          reason,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
      }),
      this.prisma.report.update({
        where: { reportId },
        data: { status: 'resolved', resolvedAt: new Date() },
      }),
      ...(statusMap[actionType]
        ? [
            this.prisma.account.update({
              where: { accountId: report.reportedId },
              data: { status: statusMap[actionType] },
            }),
          ]
        : []),
    ]);

    return { actionId: action.actionId, reportStatus: 'resolved' as const };
  }

  async dismissReport(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { reportId },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    await this.prisma.report.update({
      where: { reportId },
      data: { status: 'dismissed', resolvedAt: new Date() },
    });

    return { reportStatus: 'dismissed' as const };
  }

  async volunteerApplications(
    status?: VerificationStatus,
    page = 1,
    limit = 20,
  ) {
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.volunteerVerification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.volunteerVerification.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
