import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

type MockPrismaService = {
  chatSession: {
    findUnique: jest.Mock;
  };
  report: {
    create: jest.Mock;
  };
};

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const prismaMock: MockPrismaService = {
      chatSession: {
        findUnique: jest.fn(),
      },
      report: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<MockPrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReport', () => {
    const validDto = {
      sessionId: '11111111-1111-4111-8111-111111111111',
      reportedId: 'reported-user-id',
      category: 'harassment' as const,
      description: 'They were being rude',
    };

    it('throws BadRequestException when reporter tries to report themselves', async () => {
      await expect(
        service.createReport('same-user-id', {
          ...validDto,
          reportedId: 'same-user-id',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.chatSession.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when session does not exist', async () => {
      prisma.chatSession.findUnique.mockResolvedValue(null);

      await expect(
        service.createReport('reporter-id', validDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when reporter is not a participant', async () => {
      prisma.chatSession.findUnique.mockResolvedValue({
        seekerId: 'seeker-id',
        listenerId: 'listener-id',
      });

      await expect(
        service.createReport('non-participant-id', validDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when reported user is not a participant', async () => {
      prisma.chatSession.findUnique.mockResolvedValue({
        seekerId: 'reporter-id',
        listenerId: 'listener-id',
      });

      await expect(
        service.createReport('reporter-id', {
          ...validDto,
          reportedId: 'non-participant-id',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws ConflictException when reporter already reported this session', async () => {
      prisma.chatSession.findUnique.mockResolvedValue({
        seekerId: 'reporter-id',
        listenerId: 'reported-user-id',
      });
      prisma.report.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.createReport('reporter-id', validDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a report successfully when all checks pass', async () => {
      prisma.chatSession.findUnique.mockResolvedValue({
        seekerId: 'reporter-id',
        listenerId: 'reported-user-id',
      });
      prisma.report.create.mockResolvedValue({
        reportId: 'new-report-id',
      });

      const result = await service.createReport('reporter-id', validDto);

      expect(result).toEqual({ reportId: 'new-report-id' });
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: validDto.sessionId,
          reporterId: 'reporter-id',
          reportedId: validDto.reportedId,
          category: 'harassment',
          description: validDto.description,
          status: 'pending',
        }),
      });
    });
  });
});
