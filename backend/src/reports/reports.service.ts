import {
  ConflictException,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '../generated/prisma/client';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(accountId: string, dto: CreateReportDto) {
    const { sessionId, reportedId, category, description } = dto;

    // Prevent reporting yourself
    if (reportedId === accountId) {
      throw new BadRequestException('You cannot report yourself.');
    }

    // Verify the session exists
    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found.');
    }

    // Verify caller was a participant in the session
    if (session.seekerId !== accountId && session.listenerId !== accountId) {
      throw new BadRequestException(
        'You were not a participant in this session.',
      );
    }

    // Verify the reported user is the OTHER participant in the session
    if (session.seekerId !== reportedId && session.listenerId !== reportedId) {
      throw new BadRequestException(
        'The reported user was not a participant in this session.',
      );
    }

    // Check for duplicate report: same reporter + same session
    const existingReport = await this.prisma.report.findFirst({
      where: {
        sessionId,
        reporterId: accountId,
      },
    });

    if (existingReport) {
      throw new ConflictException('You have already reported this session.');
    }

    const report = await this.prisma.report.create({
      data: {
        sessionId,
        reporterId: accountId,
        reportedId,
        category,
        description,
        status: ReportStatus.pending,
      },
    });

    return { reportId: report.reportId };
  }
}
