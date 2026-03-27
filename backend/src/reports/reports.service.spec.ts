import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReportCategory, ReportStatus } from '../generated/prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    chatSession: {
      findUnique: jest.fn(),
    },
    report: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReport', () => {
    const reporterId = 'reporter-uuid';
    const reportedId = 'reported-uuid';
    const sessionId = 'session-uuid';
    const dto = {
      sessionId,
      reportedId,
      category: ReportCategory.harassment,
      description: 'Bad behavior',
    };

    it('should throw BadRequestException when reporting yourself', async () => {
      await expect(
        service.createReport(reporterId, { ...dto, reportedId: reporterId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when session does not exist', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue(null);

      await expect(service.createReport(reporterId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when reporter is not a participant', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue({
        sessionId,
        seekerId: 'other-user-uuid',
        listenerId: reportedId,
      });

      await expect(service.createReport(reporterId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when reported user is not a participant', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue({
        sessionId,
        seekerId: reporterId,
        listenerId: 'some-other-user',
      });

      await expect(service.createReport(reporterId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when duplicate report exists', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue({
        sessionId,
        seekerId: reporterId,
        listenerId: reportedId,
      });
      mockPrisma.report.findFirst.mockResolvedValue({ reportId: 'existing' });

      await expect(service.createReport(reporterId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create a report successfully', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue({
        sessionId,
        seekerId: reporterId,
        listenerId: reportedId,
      });
      mockPrisma.report.findFirst.mockResolvedValue(null);
      mockPrisma.report.create.mockResolvedValue({
        reportId: 'new-report-uuid',
      });

      const result = await service.createReport(reporterId, dto);

      expect(result).toEqual({ reportId: 'new-report-uuid' });
      expect(mockPrisma.report.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          reporterId,
          reportedId,
          category: ReportCategory.harassment,
          description: 'Bad behavior',
          status: ReportStatus.pending,
        },
      });
    });
  });
});
