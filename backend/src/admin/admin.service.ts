import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus } from 'src/generated/prisma/client';
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
}
