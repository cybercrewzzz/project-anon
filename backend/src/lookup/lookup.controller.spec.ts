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
    it('delegates to service', () => {
      void controller.getSpecialisations();
      expect(service.getSpecialisations).toHaveBeenCalled();
    });

    it('calls service exactly once', () => {
      void controller.getSpecialisations();
      expect(service.getSpecialisations).toHaveBeenCalledTimes(1);
    });
  });

  // ── Categories ────────────────────────────────────────────────────

  describe('getCategories', () => {
    it('delegates to service', () => {
      void controller.getCategories();
      expect(service.getCategories).toHaveBeenCalled();
    });

    it('calls service exactly once', () => {
      void controller.getCategories();
      expect(service.getCategories).toHaveBeenCalledTimes(1);
    });
  });
});
