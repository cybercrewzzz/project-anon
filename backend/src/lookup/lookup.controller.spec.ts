import { Test, TestingModule } from '@nestjs/testing';
import { LookupController } from './lookup.controller';
import { LookupService } from './lookup.service';

describe('LookupController', () => {
  let controller: LookupController;
  let service: jest.Mocked<LookupService>;

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<LookupService>> = {
      getSpecialisations: jest.fn(),
      getCategories: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LookupController],
      providers: [{ provide: LookupService, useValue: mockService }],
    }).compile();

    controller = module.get<LookupController>(LookupController);
    service = module.get(LookupService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── Specialisations ───────────────────────────────────────────────

  describe('getSpecialisations', () => {
    const mockSpecialisations = [
      {
        specialisationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Teaching',
        description: 'Teaching skills',
      },
      {
        specialisationId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Mentoring',
        description: 'Mentoring skills',
      },
    ];

    it('delegates to service and returns its result', async () => {
      service.getSpecialisations.mockResolvedValue(mockSpecialisations);

      const result = await controller.getSpecialisations();

      expect(service.getSpecialisations).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSpecialisations);
    });

    it('returns an empty array when no specialisations exist', async () => {
      service.getSpecialisations.mockResolvedValue([]);

      const result = await controller.getSpecialisations();

      expect(result).toEqual([]);
    });
  });

  // ── Categories ────────────────────────────────────────────────────

  describe('getCategories', () => {
    const mockCategories = [
      {
        categoryId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        name: 'Mental Health',
        description: 'Mental health support',
      },
      {
        categoryId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        name: 'Academic',
        description: 'Academic support',
      },
    ];

    it('delegates to service and returns its result', async () => {
      service.getCategories.mockResolvedValue(mockCategories);

      const result = await controller.getCategories();

      expect(service.getCategories).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCategories);
    });

    it('returns an empty array when no categories exist', async () => {
      service.getCategories.mockResolvedValue([]);

      const result = await controller.getCategories();

      expect(result).toEqual([]);
    });
  });
});
