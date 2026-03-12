import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ActionType,
  AccountStatus,
  ReportStatus,
  SessionStatus,
  VerificationStatus,
} from 'src/generated/prisma/client';

const createMockPrisma = () => ({
  report: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  volunteerVerification: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  account: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  accountRole: {
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  volunteerProfile: {
    count: jest.fn(),
    update: jest.fn(),
  },
  chatSession: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  accountAction: {
    create: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
});

describe('AdminService', () => {
  let service: AdminService;
  let db: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    db = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: db }],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  }); // ── Reports ───────────────────────────────────────────────────────

  describe('findAllReports', () => {
    it('returns paginated reports without a status filter', async () => {
      const reports = [{ reportId: 'r1' }];
      db.report.findMany.mockResolvedValue(reports);
      db.report.count.mockResolvedValue(1);

      const result = await service.findAllReports();

      expect(result).toEqual({ data: reports, total: 1, page: 1, limit: 20 });
      expect(db.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('filters by status when provided', async () => {
      db.report.findMany.mockResolvedValue([]);
      db.report.count.mockResolvedValue(0);

      await service.findAllReports(ReportStatus.pending);

      expect(db.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: ReportStatus.pending } }),
      );
    });

    it('applies pagination', async () => {
      db.report.findMany.mockResolvedValue([]);
      db.report.count.mockResolvedValue(50);

      const result = await service.findAllReports(undefined, 3, 10);

      expect(result).toMatchObject({ page: 3, limit: 10 });
      expect(db.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('findReport', () => {
    it('returns the report when found', async () => {
      const report = { reportId: 'r1', status: ReportStatus.pending };
      db.report.findUnique.mockResolvedValue(report);

      await expect(service.findReport('r1')).resolves.toEqual(report);
    });

    it('throws NotFoundException when report does not exist', async () => {
      db.report.findUnique.mockResolvedValue(null);

      await expect(service.findReport('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('takeAction', () => {
    const reportId = 'r1';
    const adminId = 'admin1';

    it('throws NotFoundException when report does not exist', async () => {
      db.report.findUnique.mockResolvedValue(null);

      await expect(
        service.takeAction(reportId, adminId, ActionType.warning, 'reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when report is already resolved', async () => {
      db.report.findUnique.mockResolvedValue({
        reportId,
        status: ReportStatus.resolved,
      });

      await expect(
        service.takeAction(reportId, adminId, ActionType.warning, 'reason'),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when report is already dismissed', async () => {
      db.report.findUnique.mockResolvedValue({
        reportId,
        status: ReportStatus.dismissed,
      });

      await expect(
        service.takeAction(reportId, adminId, ActionType.warning, 'reason'),
      ).rejects.toThrow(ConflictException);
    });

    it('creates action and returns resolved status on warning', async () => {
      db.report.findUnique.mockResolvedValue({
        reportId,
        status: ReportStatus.pending,
        reportedId: 'user1',
      });
      db.$transaction.mockResolvedValue([{ actionId: 'act1' }]);

      const result = await service.takeAction(
        reportId,
        adminId,
        ActionType.warning,
        'reason',
      );

      expect(result).toEqual({ actionId: 'act1', reportStatus: 'resolved' });
    });

    it('creates action and returns resolved status on suspend', async () => {
      db.report.findUnique.mockResolvedValue({
        reportId,
        status: ReportStatus.pending,
        reportedId: 'user1',
      });
      db.$transaction.mockResolvedValue([{ actionId: 'act2' }]);

      const result = await service.takeAction(
        reportId,
        adminId,
        ActionType.suspend,
        'reason',
        '2026-12-31',
      );

      expect(result).toEqual({ actionId: 'act2', reportStatus: 'resolved' });
      expect(db.$transaction).toHaveBeenCalled();
    });
  });

  describe('dismissReport', () => {
    const reportId = 'r1';

    it('throws NotFoundException when report does not exist', async () => {
      db.report.findUnique.mockResolvedValue(null);

      await expect(service.dismissReport(reportId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when report is already resolved', async () => {
      db.report.findUnique.mockResolvedValue({
        reportId,
        status: ReportStatus.resolved,
      });

      await expect(service.dismissReport(reportId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when report is already dismissed', async () => {
      db.report.findUnique.mockResolvedValue({
        reportId,
        status: ReportStatus.dismissed,
      });

      await expect(service.dismissReport(reportId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('updates report to dismissed and returns status', async () => {
      db.report.findUnique.mockResolvedValue({
        reportId,
        status: ReportStatus.pending,
      });
      db.report.update.mockResolvedValue({});

      const result = await service.dismissReport(reportId);

      expect(result).toEqual({ reportStatus: 'dismissed' });
      expect(db.report.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reportId },
          data: expect.objectContaining({ status: 'dismissed' }),
        }),
      );
    });
  }); // ── Volunteer Applications ────────────────────────────────────────

  describe('getVolunteerApplications', () => {
    it('returns paginated applications', async () => {
      const apps = [{ requestId: 'req1' }];
      db.volunteerVerification.findMany.mockResolvedValue(apps);
      db.volunteerVerification.count.mockResolvedValue(1);

      const result = await service.getVolunteerApplications();

      expect(result).toEqual({ data: apps, total: 1, page: 1, limit: 20 });
    });

    it('filters by status when provided', async () => {
      db.volunteerVerification.findMany.mockResolvedValue([]);
      db.volunteerVerification.count.mockResolvedValue(0);

      await service.getVolunteerApplications(VerificationStatus.pending);

      expect(db.volunteerVerification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: VerificationStatus.pending },
        }),
      );
    });
  });

  describe('approveVolunteerApplication', () => {
    const requestId = 'req1';
    const adminId = 'admin1';

    it('throws NotFoundException when verification not found', async () => {
      db.volunteerVerification.findUnique.mockResolvedValue(null);

      await expect(
        service.approveVolunteerApplication(requestId, adminId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when application is not pending', async () => {
      db.volunteerVerification.findUnique.mockResolvedValue({
        requestId,
        status: VerificationStatus.approved,
        volunteerId: 'v1',
      });

      await expect(
        service.approveVolunteerApplication(requestId, adminId),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when volunteer role not found in database', async () => {
      db.volunteerVerification.findUnique.mockResolvedValue({
        requestId,
        status: VerificationStatus.pending,
        volunteerId: 'v1',
      });
      db.role.findUnique.mockResolvedValue(null);

      await expect(
        service.approveVolunteerApplication(requestId, adminId),
      ).rejects.toThrow(NotFoundException);
    });

    it('approves and creates account role when it does not exist', async () => {
      db.volunteerVerification.findUnique.mockResolvedValue({
        requestId,
        status: VerificationStatus.pending,
        volunteerId: 'v1',
      });
      db.role.findUnique.mockResolvedValue({
        roleId: 'role1',
        name: 'volunteer',
      });
      db.accountRole.findUnique.mockResolvedValue(null);
      db.$transaction.mockResolvedValue([]);

      const result = await service.approveVolunteerApplication(
        requestId,
        adminId,
      );

      expect(result).toEqual({
        message: 'Volunteer approved',
        volunteerId: 'v1',
      });
    });

    it('approves and skips account role creation when it already exists', async () => {
      db.volunteerVerification.findUnique.mockResolvedValue({
        requestId,
        status: VerificationStatus.pending,
        volunteerId: 'v1',
      });
      db.role.findUnique.mockResolvedValue({
        roleId: 'role1',
        name: 'volunteer',
      });
      db.accountRole.findUnique.mockResolvedValue({
        accountId: 'v1',
        roleId: 'role1',
      });
      db.$transaction.mockResolvedValue([]);

      const result = await service.approveVolunteerApplication(
        requestId,
        adminId,
      );

      expect(result).toEqual({
        message: 'Volunteer approved',
        volunteerId: 'v1',
      });
    });
  });

  describe('rejectVolunteerApplication', () => {
    const requestId = 'req1';
    const adminId = 'admin1';

    it('throws NotFoundException when verification not found', async () => {
      db.volunteerVerification.findUnique.mockResolvedValue(null);

      await expect(
        service.rejectVolunteerApplication(requestId, adminId, 'notes'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when application is not pending', async () => {
      db.volunteerVerification.findUnique.mockResolvedValue({
        requestId,
        status: VerificationStatus.rejected,
        volunteerId: 'v1',
      });

      await expect(
        service.rejectVolunteerApplication(requestId, adminId, 'notes'),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects application and returns message', async () => {
      db.volunteerVerification.findUnique.mockResolvedValue({
        requestId,
        status: VerificationStatus.pending,
        volunteerId: 'v1',
      });
      db.$transaction.mockResolvedValue([]);

      const result = await service.rejectVolunteerApplication(
        requestId,
        adminId,
        'Not qualified',
      );

      expect(result).toEqual({ message: 'Application rejected' });
    });
  }); // ── Accounts ──────────────────────────────────────────────────────

  describe('findAllAccounts', () => {
    it('returns paginated accounts with roles mapped', async () => {
      const accounts = [
        {
          accountId: 'a1',
          accountRoles: [{ role: { name: 'user' } }],
        },
      ];
      db.account.findMany.mockResolvedValue(accounts);
      db.account.count.mockResolvedValue(1);

      const result = await service.findAllAccounts();

      expect(result.data[0].roles).toEqual(['user']);
      expect(result.data[0].accountRoles).toBeUndefined();
    });

    it('applies search, role, and status filters', async () => {
      db.account.findMany.mockResolvedValue([]);
      db.account.count.mockResolvedValue(0);

      await service.findAllAccounts('john', 'volunteer', AccountStatus.active);

      expect(db.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: AccountStatus.active,
            OR: expect.any(Array),
            accountRoles: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('findAccount', () => {
    it('returns account detail with roles mapped', async () => {
      const account = {
        accountId: 'a1',
        accountRoles: [{ role: { name: 'admin' } }],
        actionsReceived: [],
        reportsReceived: [],
        reportsFiled: [],
      };
      db.account.findUnique.mockResolvedValue(account);

      const result = await service.findAccount('a1');

      expect(result.roles).toEqual(['admin']);
      expect(result.accountRoles).toBeUndefined();
    });

    it('throws NotFoundException when account not found', async () => {
      db.account.findUnique.mockResolvedValue(null);

      await expect(service.findAccount('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('takeAccountAction', () => {
    const accountId = 'a1';
    const adminId = 'admin1';

    it('throws NotFoundException when account not found', async () => {
      db.account.findUnique.mockResolvedValue(null);

      await expect(
        service.takeAccountAction(
          accountId,
          adminId,
          ActionType.warning,
          'reason',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates action and returns actionId on warning', async () => {
      db.account.findUnique.mockResolvedValue({ accountId });
      db.$transaction.mockResolvedValue([{ actionId: 'act1' }]);

      const result = await service.takeAccountAction(
        accountId,
        adminId,
        ActionType.warning,
        'reason',
      );

      expect(result).toEqual({ actionId: 'act1' });
    });

    it('creates action and returns actionId on ban', async () => {
      db.account.findUnique.mockResolvedValue({ accountId });
      db.$transaction.mockResolvedValue([{ actionId: 'act2' }]);

      const result = await service.takeAccountAction(
        accountId,
        adminId,
        ActionType.ban,
        'severe violation',
      );

      expect(result).toEqual({ actionId: 'act2' });
      expect(db.$transaction).toHaveBeenCalled();
    });
  }); // ── Sessions ──────────────────────────────────────────────────────

  describe('findAllSessions', () => {
    it('returns paginated sessions with category mapped from problem', async () => {
      const sessions = [
        { sessionId: 's1', problem: { category: { name: 'anxiety' } } },
      ];
      db.chatSession.findMany.mockResolvedValue(sessions);
      db.chatSession.count.mockResolvedValue(1);

      const result = await service.findAllSessions();

      expect(result.data[0]).toMatchObject({
        sessionId: 's1',
        category: 'anxiety',
      });
      expect(result.data[0].problem).toBeUndefined();
    });

    it('maps category to null when problem is null', async () => {
      db.chatSession.findMany.mockResolvedValue([
        { sessionId: 's2', problem: null },
      ]);
      db.chatSession.count.mockResolvedValue(1);

      const result = await service.findAllSessions();

      expect(result.data[0].category).toBeNull();
    });

    it('applies status, seekerId, and listenerId filters', async () => {
      db.chatSession.findMany.mockResolvedValue([]);
      db.chatSession.count.mockResolvedValue(0);

      await service.findAllSessions(
        SessionStatus.active,
        'seeker1',
        'listener1',
      );

      expect(db.chatSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: SessionStatus.active,
            seekerId: 'seeker1',
            listenerId: 'listener1',
          },
        }),
      );
    });
  }); // ── Dashboard Stats ───────────────────────────────────────────────

  describe('getDashboardStats', () => {
    it('returns all dashboard stats', async () => {
      db.account.count.mockResolvedValue(100);
      db.accountRole.count.mockResolvedValue(30);
      db.volunteerProfile.count.mockResolvedValue(15);
      db.chatSession.count.mockResolvedValue(5);
      db.report.count.mockResolvedValue(3);
      db.volunteerVerification.count.mockResolvedValue(7);

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        totalAccounts: 100,
        totalVolunteers: 30,
        activeVolunteers: 15,
        sessionsToday: 5,
        pendingReports: 3,
        pendingApplications: 7,
      });
    });
  });
});
