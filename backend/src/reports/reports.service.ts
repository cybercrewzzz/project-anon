import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReportCategory, ReportStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateReportDto } from './dto/create-report.dto';

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS SERVICE
//
// Handles the business logic for abuse reports. A report is always tied to a
// specific ChatSession and records *who* reported *whom*, with a category and
// optional description.
//
// Key rules from the README:
//   1. Reporter must be a participant of the session (seeker OR listener).
//   2. The reportedId must be the OTHER participant in the session.
//   3. A user can only report a session once (duplicate → 409 Conflict).
//   4. Both users and volunteers can file reports.
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit an abuse report for a session.
   *
   * @param reporterId - The account ID of the person filing the report (from JWT).
   * @param dto        - Validated request body containing sessionId, reportedId,
   *                     category, and optional description.
   * @returns          - The created report's ID.
   */
  async createReport(reporterId: string, dto: CreateReportDto) {
    const { sessionId, reportedId, category, description } = dto;

    // ── Guard: Cannot report yourself ───────────────────────────────────
    if (reporterId === reportedId) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'cannot_report_self',
        message: 'You cannot report yourself.',
      });
    }

    // ── Verify session exists and reporter is a participant ─────────────
    const session = await this.prisma.chatSession.findUnique({
      where: { sessionId },
      select: { seekerId: true, listenerId: true },
    });

    if (!session) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'session_not_found',
        message: 'Session not found.',
      });
    }

    const isParticipant =
      session.seekerId === reporterId || session.listenerId === reporterId;

    if (!isParticipant) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'reporter_not_in_session',
        message: 'You are not a participant of this session.',
      });
    }

    // ── Verify the reported user is the OTHER participant ───────────────
    const isReportedParticipant =
      session.seekerId === reportedId || session.listenerId === reportedId;

    if (!isReportedParticipant) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'reported_not_in_session',
        message: 'The reported user is not a participant of this session.',
      });
    }

    // ── Create the report ──────────────────────────────────────────────
    // Using try/catch to handle Prisma P2002 unique constraint violations,
    // which prevents race conditions during concurrent requests.
    let report;
    try {
      report = await this.prisma.report.create({
        data: {
          sessionId,
          reporterId,
          reportedId,
          category: category as ReportCategory,
          description: description ?? null,
          status: ReportStatus.pending,
        },
      });
    } catch (error) {
      if ((error as any)?.code === 'P2002') {
        throw new ConflictException({
          statusCode: 409,
          error: 'already_reported',
          message: 'You have already reported this session.',
        });
      }
      throw error;
    }

    this.logger.log(
      `Report ${report.reportId} created: reporter=${reporterId} reported=${reportedId} session=${sessionId} category=${category}`,
    );

    return { reportId: report.reportId };
  }
}
