import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { PrismaService } from '../prisma/prisma.service';

const createMockPrisma = () => ({
  account: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  volunteerProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  volunteerSpecialisation: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  volunteerVerification: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  volunteerExperience: {
    create: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
});

describe('VolunteerService', () => {
  let service: VolunteerService;
  let db: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    db = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [VolunteerService, { provide: PrismaService, useValue: db }],
    }).compile();

    service = module.get<VolunteerService>(VolunteerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getProfile ────────────────────────────────────────────────────

  describe('getProfile', () => {
    const accountId = 'test-account-id';

    it('should return volunteer profile when found', async () => {
      const mockAccount = {
        name: 'John Doe',
        volunteerProfile: {
          accountId,
          instituteEmail: 'john@university.edu',
          instituteName: 'Test University',
          studentId: 'STU123',
          instituteIdImageUrl: 'https://example.com/id.jpg',
          grade: 'A+',
          about: 'Passionate volunteer',
          verificationStatus: 'approved',
          isAvailable: true,
        },
        volunteerSpecialisations: [
          {
            specialisation: {
              specialisationId: 'spec-1',
              name: 'Teaching',
              description: 'Teaching skills',
            },
          },
          {
            specialisation: {
              specialisationId: 'spec-2',
              name: 'Mentoring',
              description: 'Mentoring skills',
            },
          },
        ],
        volunteerExperience: {
          points: 150,
          level: 3,
          lastUpdated: new Date(),
        },
      };

      db.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.getProfile(accountId);

      expect(db.account.findUnique).toHaveBeenCalledWith({
        where: { accountId },
        select: {
          name: true,
          volunteerProfile: true,
          volunteerSpecialisations: {
            include: { specialisation: true },
          },
          volunteerExperience: true,
        },
      });

      expect(result).toEqual({
        accountId,
        name: 'John Doe',
        instituteEmail: 'john@university.edu',
        instituteName: 'Test University',
        studentId: 'STU123',
        instituteIdImageUrl: 'https://example.com/id.jpg',
        grade: 'A+',
        about: 'Passionate volunteer',
        verificationStatus: 'approved',
        isAvailable: true,
        specialisations: [
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
        ],
        experience: {
          points: 150,
          level: 3,
          lastUpdated: mockAccount.volunteerExperience.lastUpdated,
        },
      });
    });

    it('should return null experience when volunteer experience is not found', async () => {
      db.account.findUnique.mockResolvedValue({
        name: 'Jane Doe',
        volunteerProfile: {
          accountId,
          instituteEmail: 'jane@university.edu',
          instituteName: 'Test University',
          studentId: 'STU124',
          instituteIdImageUrl: 'https://example.com/id2.jpg',
          grade: 'A',
          about: 'New volunteer',
          verificationStatus: 'pending',
          isAvailable: false,
        },
        volunteerSpecialisations: [],
        volunteerExperience: null,
      });

      const result = await service.getProfile(accountId);

      expect(result.experience).toBeNull();
    });

    it('throws NotFoundException when volunteer profile not found', async () => {
      db.account.findUnique.mockResolvedValue({
        name: 'John Doe',
        volunteerProfile: null,
      });

      await expect(service.getProfile(accountId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when account not found', async () => {
      db.account.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(accountId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── updateProfile ─────────────────────────────────────────────────

  describe('updateProfile', () => {
    const accountId = 'test-account-id';
    const updateDto = {
      about: 'Updated about text',
      specialisationIds: ['spec-1', 'spec-2'],
    };

    it('updates profile and returns result of getProfile', async () => {
      db.volunteerProfile.findUnique.mockResolvedValue({ accountId });
      db.$transaction.mockImplementation((fn: (tx: typeof db) => unknown) =>
        fn(db),
      );
      db.account.findUnique.mockResolvedValue({
        name: 'John Doe',
        volunteerProfile: {
          accountId,
          about: 'Updated about text',
          verificationStatus: 'approved',
          isAvailable: true,
        },
        volunteerSpecialisations: [
          {
            specialisation: {
              specialisationId: 'spec-1',
              name: 'Teaching',
              description: 'Teaching skills',
            },
          },
        ],
        volunteerExperience: null,
      });

      await service.updateProfile(accountId, updateDto);

      expect(db.volunteerProfile.findUnique).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(db.volunteerProfile.update).toHaveBeenCalledWith({
        where: { accountId },
        data: { about: 'Updated about text' },
      });
    });

    it('skips specialisation transaction when specialisationIds is not provided', async () => {
      const updateDtoAboutOnly = { about: 'Updated about' };

      db.volunteerProfile.findUnique.mockResolvedValue({ accountId });
      db.account.findUnique.mockResolvedValue({
        name: 'John Doe',
        volunteerProfile: {
          accountId,
          about: 'Updated about',
          verificationStatus: 'approved',
          isAvailable: true,
        },
        volunteerSpecialisations: [],
        volunteerExperience: null,
      });

      await service.updateProfile(accountId, updateDtoAboutOnly);

      expect(db.volunteerProfile.update).toHaveBeenCalledWith({
        where: { accountId },
        data: { about: 'Updated about' },
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when profile does not exist', async () => {
      db.volunteerProfile.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile(accountId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('runs specialisation delete+create in a transaction', async () => {
      db.volunteerProfile.findUnique.mockResolvedValue({ accountId });
      db.$transaction.mockImplementation((fn: (tx: typeof db) => unknown) =>
        fn(db),
      );
      db.account.findUnique.mockResolvedValue({
        name: 'John Doe',
        volunteerProfile: { accountId },
        volunteerSpecialisations: [],
        volunteerExperience: null,
      });

      await service.updateProfile(accountId, updateDto);

      expect(db.$transaction).toHaveBeenCalled();
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────

  describe('updateStatus', () => {
    const accountId = 'test-account-id';

    it('updates availability to true and returns isAvailable', async () => {
      db.volunteerProfile.findUnique.mockResolvedValue({
        accountId,
        isAvailable: false,
      });
      db.volunteerProfile.update.mockResolvedValue({ isAvailable: true });

      const result = await service.updateStatus(accountId, { available: true });

      expect(db.volunteerProfile.findUnique).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(db.volunteerProfile.update).toHaveBeenCalledWith({
        where: { accountId },
        data: { isAvailable: true },
      });
      expect(result).toEqual({ isAvailable: true });
    });

    it('updates availability to false and returns isAvailable', async () => {
      db.volunteerProfile.findUnique.mockResolvedValue({
        accountId,
        isAvailable: true,
      });
      db.volunteerProfile.update.mockResolvedValue({ isAvailable: false });

      const result = await service.updateStatus(accountId, {
        available: false,
      });

      expect(result).toEqual({ isAvailable: false });
    });

    it('throws NotFoundException when profile does not exist', async () => {
      db.volunteerProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus(accountId, { available: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── applyAsVolunteer ──────────────────────────────────────────────

  describe('applyAsVolunteer', () => {
    const accountId = 'test-account-id';
    const applyDto = {
      name: 'John Doe',
      instituteEmail: 'john@university.edu',
      instituteName: 'Test University',
      studentId: 'STU123',
      instituteIdImageUrl: 'https://example.com/id.jpg',
      grade: 'A+',
      about: 'Passionate volunteer',
      specialisationIds: ['spec-1', 'spec-2'],
    };

    it('creates application and returns submitted message', async () => {
      db.volunteerVerification.findFirst.mockResolvedValue(null);
      db.$transaction.mockImplementation((fn: (tx: typeof db) => unknown) =>
        fn(db),
      );

      const result = await service.applyAsVolunteer(accountId, applyDto);

      expect(db.volunteerVerification.findFirst).toHaveBeenCalledWith({
        where: {
          volunteerId: accountId,
          status: { in: ['pending', 'approved'] },
        },
      });
      expect(db.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Application submitted',
        verificationStatus: 'pending',
      });
    });

    it('throws ConflictException when a pending application already exists', async () => {
      db.volunteerVerification.findFirst.mockResolvedValue({
        volunteerId: accountId,
        status: 'pending',
      });

      await expect(
        service.applyAsVolunteer(accountId, applyDto),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when an approved application already exists', async () => {
      db.volunteerVerification.findFirst.mockResolvedValue({
        volunteerId: accountId,
        status: 'approved',
      });

      await expect(
        service.applyAsVolunteer(accountId, applyDto),
      ).rejects.toThrow(ConflictException);
    });

    it('handles optional about field when not provided', async () => {
      const applyDtoWithoutAbout = {
        name: applyDto.name,
        instituteEmail: applyDto.instituteEmail,
        instituteName: applyDto.instituteName,
        studentId: applyDto.studentId,
        instituteIdImageUrl: applyDto.instituteIdImageUrl,
        grade: applyDto.grade,
        specialisationIds: applyDto.specialisationIds,
      };

      db.volunteerVerification.findFirst.mockResolvedValue(null);
      db.$transaction.mockImplementation((fn: (tx: typeof db) => unknown) =>
        fn(db),
      );

      const result = await service.applyAsVolunteer(
        accountId,
        applyDtoWithoutAbout,
      );

      expect(result.verificationStatus).toBe('pending');
    });
  });
});
