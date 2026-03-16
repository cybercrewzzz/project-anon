import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import {
  ActionType,
  AccountStatus,
  ReportStatus,
  SessionStatus,
  VerificationStatus,
} from 'src/generated/prisma/client';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;

  const ADMIN_ID = '07e78a03-c194-4140-a73a-ba4a1cb57998';
  const REPORT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const REQUEST_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const ACCOUNT_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<AdminService>> = {
      findAllReports: jest.fn(),
      findReport: jest.fn(),
      takeAction: jest.fn(),
      dismissReport: jest.fn(),
      getVolunteerApplications: jest.fn(),
      approveVolunteerApplication: jest.fn(),
      rejectVolunteerApplication: jest.fn(),
      findAllAccounts: jest.fn(),
      findAccount: jest.fn(),
      takeAccountAction: jest.fn(),
      findAllSessions: jest.fn(),
      getDashboardStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockService }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── Reports ───────────────────────────────────────────────────────

  describe('findAllReports', () => {
    it('passes status and parsed pagination to service', () => {
      void controller.findAllReports({
        status: ReportStatus.pending,
        page: 2,
        limit: 15,
      });
      expect(service.findAllReports).toHaveBeenCalledWith(
        ReportStatus.pending,
        2,
        15,
      );
    });

    it('passes undefined when query params are omitted', () => {
      void controller.findAllReports({});
      expect(service.findAllReports).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('findReport', () => {
    it('delegates to service with reportId', () => {
      void controller.findReport(REPORT_ID);
      expect(service.findReport).toHaveBeenCalledWith(REPORT_ID);
    });
  });

  describe('takeAction', () => {
    it('delegates to service with admin ID from JWT', () => {
      const body = {
        actionType: ActionType.warning,
        reason: 'test reason',
        expiresAt: undefined,
      };
      void controller.takeAction(REPORT_ID, body, ADMIN_ID);
      expect(service.takeAction).toHaveBeenCalledWith(
        REPORT_ID,
        ADMIN_ID,
        ActionType.warning,
        'test reason',
        undefined,
      );
    });

    it('forwards expiresAt when provided', () => {
      const body = {
        actionType: ActionType.suspend,
        reason: 'violation',
        expiresAt: '2026-12-31',
      };
      void controller.takeAction(REPORT_ID, body, ADMIN_ID);
      expect(service.takeAction).toHaveBeenCalledWith(
        REPORT_ID,
        ADMIN_ID,
        ActionType.suspend,
        'violation',
        '2026-12-31',
      );
    });
  });

  describe('dismissReport', () => {
    it('delegates to service with reportId', () => {
      void controller.dismissReport(REPORT_ID);
      expect(service.dismissReport).toHaveBeenCalledWith(REPORT_ID);
    });
  });

  // ── Volunteer Applications ────────────────────────────────────────

  describe('getVolunteerApplications', () => {
    it('passes status and parsed pagination to service', () => {
      void controller.getVolunteerApplications({
        status: VerificationStatus.pending,
        page: 1,
        limit: 20,
      });
      expect(service.getVolunteerApplications).toHaveBeenCalledWith(
        VerificationStatus.pending,
        1,
        20,
      );
    });

    it('passes undefined when query params are omitted', () => {
      void controller.getVolunteerApplications({});
      expect(service.getVolunteerApplications).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('approveVolunteerApplication', () => {
    it('delegates to service with admin ID from JWT', () => {
      void controller.approveVolunteerApplication(REQUEST_ID, ADMIN_ID);
      expect(service.approveVolunteerApplication).toHaveBeenCalledWith(
        REQUEST_ID,
        ADMIN_ID,
      );
    });
  });

  describe('rejectVolunteerApplication', () => {
    it('delegates to service with admin ID and adminNotes', () => {
      void controller.rejectVolunteerApplication(
        REQUEST_ID,
        { adminNotes: 'Not qualified' },
        ADMIN_ID,
      );
      expect(service.rejectVolunteerApplication).toHaveBeenCalledWith(
        REQUEST_ID,
        ADMIN_ID,
        'Not qualified',
      );
    });
  });

  // ── Accounts ──────────────────────────────────────────────────────

  describe('findAllAccounts', () => {
    it('passes all filters and parsed pagination to service', () => {
      void controller.findAllAccounts({
        search: 'john',
        role: 'volunteer',
        status: AccountStatus.active,
        page: 3,
        limit: 25,
      });
      expect(service.findAllAccounts).toHaveBeenCalledWith(
        'john',
        'volunteer',
        AccountStatus.active,
        3,
        25,
      );
    });

    it('passes undefined when query params are omitted', () => {
      void controller.findAllAccounts({});
      expect(service.findAllAccounts).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('findAccount', () => {
    it('delegates to service with accountId', () => {
      void controller.findAccount(ACCOUNT_ID);
      expect(service.findAccount).toHaveBeenCalledWith(ACCOUNT_ID);
    });
  });

  describe('takeAccountAction', () => {
    it('delegates to service with admin ID from JWT', () => {
      const body = {
        actionType: ActionType.ban,
        reason: 'severe violation',
        expiresAt: undefined,
      };
      void controller.takeAccountAction(ACCOUNT_ID, body, ADMIN_ID);
      expect(service.takeAccountAction).toHaveBeenCalledWith(
        ACCOUNT_ID,
        ADMIN_ID,
        ActionType.ban,
        'severe violation',
        undefined,
      );
    });
  });

  // ── Sessions ──────────────────────────────────────────────────────

  describe('findAllSessions', () => {
    it('passes filters and parsed pagination to service', () => {
      void controller.findAllSessions({
        status: SessionStatus.active,
        seekerId: 'seeker-id',
        listenerId: 'listener-id',
        page: 1,
        limit: 10,
      });
      expect(service.findAllSessions).toHaveBeenCalledWith(
        SessionStatus.active,
        'seeker-id',
        'listener-id',
        1,
        10,
      );
    });

    it('passes undefined when query params are omitted', () => {
      void controller.findAllSessions({});
      expect(service.findAllSessions).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  // ── Dashboard ─────────────────────────────────────────────────────

  describe('getDashboardStats', () => {
    it('delegates to service', () => {
      void controller.getDashboardStats();
      expect(service.getDashboardStats).toHaveBeenCalled();
    });
  });
});
