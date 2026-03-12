import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  ActionType,
  ReportStatus,
  SessionStatus,
  VerificationStatus,
} from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitizePagination(page?: number, limit?: number) {
    const p = Math.max(1, Number.isFinite(page) ? page! : 1);
    const l = Math.min(100, Math.max(1, Number.isFinite(limit) ? limit! : 20));
    return { page: p, limit: l, skip: (p - 1) * l };
  }

  // ── Reports ─────────────────────────────────────────────────────

  async findAllReports(status?: ReportStatus, page?: number, limit?: number) {
    const where = status ? { status } : {};
    const { page: p, limit: l, skip } = this.sanitizePagination(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: l,
        orderBy: { reportedAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { data, total, page: p, limit: l };
  }

  async findReport(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { reportId },
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

    if (report.status === 'resolved' || report.status === 'dismissed') {
      throw new ConflictException(`Report is already ${report.status}`);
    }

    const statusMap: Partial<Record<ActionType, AccountStatus>> = {
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

    if (report.status === 'resolved' || report.status === 'dismissed') {
      throw new ConflictException(`Report is already ${report.status}`);
    }

    await this.prisma.report.update({
      where: { reportId },
      data: { status: 'dismissed', resolvedAt: new Date() },
    });

    return { reportStatus: 'dismissed' as const };
  }

  // ── Volunteer Applications ──────────────────────────────────────

  async getVolunteerApplications(
    status?: VerificationStatus,
    page?: number,
    limit?: number,
  ) {
    const where = status ? { status } : {};
    const { page: p, limit: l, skip } = this.sanitizePagination(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.volunteerVerification.findMany({
        where,
        skip,
        take: l,
        orderBy: { submittedAt: 'desc' },
        include: {
          volunteer: {
            select: {
              name: true,
              volunteerProfile: { select: { instituteName: true } },
            },
          },
        },
      }),
      this.prisma.volunteerVerification.count({ where }),
    ]);

    return { data, total, page: p, limit: l };
  }

  async approveVolunteerApplication(requestId: string, adminId: string) {
    const verification = await this.prisma.volunteerVerification.findUnique({
      where: { requestId },
    });

    if (!verification) {
      throw new NotFoundException(
        `Verification request ${requestId} not found`,
      );
    }

    if (verification.status !== 'pending') {
      throw new ConflictException(
        `Application is already ${verification.status}`,
      );
    }

    const volunteerRole = await this.prisma.role.findUnique({
      where: { name: 'volunteer' },
    });

    if (!volunteerRole) {
      throw new NotFoundException('Volunteer role not found in database');
    }

    const existingAccountRole = await this.prisma.accountRole.findUnique({
      where: {
        accountId_roleId: {
          accountId: verification.volunteerId,
          roleId: volunteerRole.roleId,
        },
      },
    });

    await this.prisma.$transaction([
      this.prisma.volunteerVerification.update({
        where: { requestId },
        data: {
          status: 'approved',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.volunteerProfile.update({
        where: { accountId: verification.volunteerId },
        data: { verificationStatus: 'approved' },
      }),
      ...(existingAccountRole
        ? []
        : [
            this.prisma.accountRole.create({
              data: {
                accountId: verification.volunteerId,
                roleId: volunteerRole.roleId,
                assignedBy: adminId,
              },
            }),
          ]),
    ]);

    return {
      message: 'Volunteer approved',
      volunteerId: verification.volunteerId,
    };
  }

  async rejectVolunteerApplication(
    requestId: string,
    adminId: string,
    adminNotes: string,
  ) {
    const verification = await this.prisma.volunteerVerification.findUnique({
      where: { requestId },
    });

    if (!verification) {
      throw new NotFoundException(
        `Verification request ${requestId} not found`,
      );
    }

    if (verification.status !== 'pending') {
      throw new ConflictException(
        `Application is already ${verification.status}`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.volunteerVerification.update({
        where: { requestId },
        data: {
          status: 'rejected',
          adminNotes,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.volunteerProfile.update({
        where: { accountId: verification.volunteerId },
        data: { verificationStatus: 'rejected' },
      }),
    ]);

    return { message: 'Application rejected' };
  }

  // ── Accounts ────────────────────────────────────────────────────

  async findAllAccounts(
    search?: string,
    role?: string,
    status?: AccountStatus,
    page?: number,
    limit?: number,
  ) {
    const { page: p, limit: l, skip } = this.sanitizePagination(page, limit);

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.accountRoles = {
        some: { role: { name: role } },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        select: {
          accountId: true,
          email: true,
          name: true,
          nickname: true,
          status: true,
          createdAt: true,
          accountRoles: {
            select: { role: { select: { name: true } } },
          },
        },
      }),
      this.prisma.account.count({ where }),
    ]);

    const mapped = data.map((a) => ({
      ...a,
      roles: a.accountRoles.map((ar) => ar.role.name),
      accountRoles: undefined,
    }));

    return { data: mapped, total, page: p, limit: l };
  }

  async findAccount(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { accountId },
      select: {
        accountId: true,
        email: true,
        name: true,
        nickname: true,
        dateOfBirth: true,
        gender: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        accountRoles: {
          select: { role: { select: { name: true } } },
        },
        actionsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            actionId: true,
            actionType: true,
            reason: true,
            createdAt: true,
            expiresAt: true,
            admin: { select: { accountId: true, email: true } },
          },
        },
        reportsReceived: {
          orderBy: { reportedAt: 'desc' },
          take: 10,
          select: {
            reportId: true,
            category: true,
            status: true,
            reportedAt: true,
          },
        },
        reportsFiled: {
          orderBy: { reportedAt: 'desc' },
          take: 10,
          select: {
            reportId: true,
            category: true,
            status: true,
            reportedAt: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    return {
      ...account,
      roles: account.accountRoles.map((ar) => ar.role.name),
      accountRoles: undefined,
    };
  }

  async takeAccountAction(
    accountId: string,
    adminId: string,
    actionType: ActionType,
    reason: string,
    expiresAt?: string,
  ) {
    const account = await this.prisma.account.findUnique({
      where: { accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    const statusMap: Partial<Record<ActionType, AccountStatus>> = {
      suspend: 'suspended',
      ban: 'banned',
    };

    const [action] = await this.prisma.$transaction([
      this.prisma.accountAction.create({
        data: {
          accountId,
          adminId,
          actionType,
          reason,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
      }),
      ...(statusMap[actionType]
        ? [
            this.prisma.account.update({
              where: { accountId },
              data: { status: statusMap[actionType] },
            }),
          ]
        : []),
    ]);

    return { actionId: action.actionId };
  }

  // ── Sessions ────────────────────────────────────────────────────

  async findAllSessions(
    status?: SessionStatus,
    seekerId?: string,
    listenerId?: string,
    page?: number,
    limit?: number,
  ) {
    const { page: p, limit: l, skip } = this.sanitizePagination(page, limit);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (seekerId) where.seekerId = seekerId;
    if (listenerId) where.listenerId = listenerId;

    const [data, total] = await Promise.all([
      this.prisma.chatSession.findMany({
        where,
        skip,
        take: l,
        orderBy: { startedAt: 'desc' },
        select: {
          sessionId: true,
          seekerId: true,
          listenerId: true,
          status: true,
          startedAt: true,
          endedAt: true,
          closedReason: true,
          userRating: true,
          volunteerRating: true,
          problem: {
            select: {
              category: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.chatSession.count({ where }),
    ]);

    const mapped = data.map((s) => ({
      ...s,
      category: s.problem?.category?.name ?? null,
      problem: undefined,
    }));

    return { data: mapped, total, page: p, limit: l };
  }

  // ── Dashboard Stats ─────────────────────────────────────────────

  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [
      totalAccounts,
      totalVolunteers,
      activeVolunteers,
      sessionsToday,
      pendingReports,
      pendingApplications,
    ] = await Promise.all([
      this.prisma.account.count(),
      this.prisma.accountRole.count({
        where: { role: { name: 'volunteer' } },
      }),
      this.prisma.volunteerProfile.count({
        where: { isAvailable: true, verificationStatus: 'approved' },
      }),
      this.prisma.chatSession.count({
        where: { startedAt: { gte: todayStart } },
      }),
      this.prisma.report.count({
        where: { status: 'pending' },
      }),
      this.prisma.volunteerVerification.count({
        where: { status: 'pending' },
      }),
    ]);

    return {
      totalAccounts,
      totalVolunteers,
      activeVolunteers,
      sessionsToday,
      pendingReports,
      pendingApplications,
    };
  }
}
