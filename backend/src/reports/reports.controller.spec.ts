import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateReportSchema } from './dto/create-report.dto';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: jest.Mocked<ReportsService>;

  const mockReportsService = {
    createReport: jest.fn(),
  } as unknown as jest.Mocked<ReportsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delegates to ReportsService.createReport with reporterId from JWT and DTO', async () => {
      const reporterId = '2f1a1725-157d-4e84-91d5-015786561dc7';
      const dto = {
        sessionId: '6f5575db-1334-4bd3-8ece-f41026f15029',
        reportedId: '168ce48c-c8f6-4b0e-ba56-e018f4a639f3',
        category: 'harassment' as const,
        description: 'They were rude',
      };
      const expected = { reportId: 'e228d63a-1ba4-43f4-8678-a61114f0da59' };
      service.createReport.mockResolvedValue(expected);

      const result = await controller.create(reporterId, dto);

      expect(service.createReport).toHaveBeenCalledWith(reporterId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('validation pipes', () => {
    it('rejects invalid report body payload', () => {
      const bodyPipe = new ZodValidationPipe(CreateReportSchema);

      expect(() =>
        bodyPipe.transform({
          sessionId: 'not-a-uuid',
          reportedId: 'also-not-a-uuid',
          category: 'invalid_category',
        }),
      ).toThrow(BadRequestException);
    });

    it('accepts valid report body payload', () => {
      const bodyPipe = new ZodValidationPipe(CreateReportSchema);

      const result = bodyPipe.transform({
        sessionId: '6f5575db-1334-4bd3-8ece-f41026f15029',
        reportedId: '168ce48c-c8f6-4b0e-ba56-e018f4a639f3',
        category: 'harassment',
        description: 'Being rude',
      });

      expect(result).toEqual({
        sessionId: '6f5575db-1334-4bd3-8ece-f41026f15029',
        reportedId: '168ce48c-c8f6-4b0e-ba56-e018f4a639f3',
        category: 'harassment',
        description: 'Being rude',
      });
    });
  });
});
