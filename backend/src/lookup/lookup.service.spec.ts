import { Test, TestingModule } from '@nestjs/testing';
import { LookupService } from './lookup.service';
import { PrismaService } from '../prisma/prisma.service';

const createMockPrisma = () => ({
  specialisation: {
    findMany: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
  },
});

describe('LookupService', () => {
  let service: LookupService;
  let db: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    db = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [LookupService, { provide: PrismaService, useValue: db }],
    }).compile();

    service = module.get<LookupService>(LookupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getSpecialisations ────────────────────────────────────────────

  describe('getSpecialisations', () => {
    it('returns all specialisations', async () => {
      const specialisations = [
        {
          specialisationId: 'spec-1',
          name: 'Teaching',
          description: 'Teaching skills',
        },
        {
          specialisationId: 'spec-2',
          name: 'Mentoring',
          description: 'Mentoring skills',
        },
      ];
      db.specialisation.findMany.mockResolvedValue(specialisations);

      const result = await service.getSpecialisations();

      expect(result).toEqual(specialisations);
    });

    it('queries with correct select and orderBy', async () => {
      db.specialisation.findMany.mockResolvedValue([]);

      await service.getSpecialisations();

      expect(db.specialisation.findMany).toHaveBeenCalledWith({
        select: {
          specialisationId: true,
          name: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      });
    });

    it('returns empty array when no specialisations exist', async () => {
      db.specialisation.findMany.mockResolvedValue([]);

      const result = await service.getSpecialisations();

      expect(result).toEqual([]);
    });
  });

  // ── getCategories ─────────────────────────────────────────────────

  describe('getCategories', () => {
    it('returns all categories', async () => {
      const categories = [
        {
          categoryId: 'cat-1',
          name: 'Anxiety',
          description: 'Anxiety related issues',
        },
        {
          categoryId: 'cat-2',
          name: 'Depression',
          description: 'Depression related issues',
        },
      ];
      db.category.findMany.mockResolvedValue(categories);

      const result = await service.getCategories();

      expect(result).toEqual(categories);
    });

    it('queries with correct select and orderBy', async () => {
      db.category.findMany.mockResolvedValue([]);

      await service.getCategories();

      expect(db.category.findMany).toHaveBeenCalledWith({
        select: {
          categoryId: true,
          name: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      });
    });

    it('returns empty array when no categories exist', async () => {
      db.category.findMany.mockResolvedValue([]);

      const result = await service.getCategories();

      expect(result).toEqual([]);
    });
  });
});
