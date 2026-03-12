import { Injectable } from '@nestjs/common';
import { ReportStatus } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllReports(status?: ReportStatus, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
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
}
