import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportCategory } from '../generated/prisma/client';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockReportsService = {
    createReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReport', () => {
    it('should create a report and return the reportId', async () => {
      const accountId = 'reporter-uuid';
      const dto = {
        sessionId: 'session-uuid',
        reportedId: 'reported-uuid',
        category: ReportCategory.harassment,
        description: 'Inappropriate behavior',
      };
      const expected = { reportId: 'report-uuid' };

      mockReportsService.createReport.mockResolvedValue(expected);

      const result = await controller.createReport(accountId, dto);

      expect(result).toEqual(expected);
      expect(service.createReport).toHaveBeenCalledWith(accountId, dto);
    });
  });
});
