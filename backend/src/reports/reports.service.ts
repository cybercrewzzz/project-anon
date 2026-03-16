import {
  ConflictException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(accountId: string, dto: CreateReportDto) {
    const { sessionId, reportedId, category, description } = dto;

    // Verify caller was a participant in the session
    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
    });

    if (
      !session ||
      (session.seekerId !== accountId && session.listenerId !== accountId)
    ) {
      throw new BadRequestException('You were not a participant in this session.');
    }

    // Prevent reporting yourself
    if (reportedId === accountId) {
      throw new BadRequestException('You cannot report yourself.');
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
        status: 'pending',
      },
    });

    return { reportId: report.reportId };
  }
}