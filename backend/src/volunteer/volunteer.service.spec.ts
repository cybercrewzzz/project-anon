import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { PrismaService } from '../prisma/prisma.service';

// Separate tx mock — isolates operations inside $transaction from direct db access.
// Any accidental this.prisma.X call inside a transaction callback now uses a
// different object and will return undefined instead of silently passing.
const createMockTx = () => ({
  volunteerProfile: {
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
    upsert: jest.fn(),
  },
  account: {
    update: jest.fn(),
  },
});

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
    const mockProfileResult = {
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
    };

    it('runs profile update and specialisation replace inside a transaction', async () => {
      const tx = createMockTx();
      db.account.findUnique
        .mockResolvedValueOnce({ status: 'active' }) // assertAccountActive
        .mockResolvedValue(mockProfileResult); // getProfile
      db.volunteerProfile.findUnique.mockResolvedValue({ accountId });
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      await service.updateProfile(accountId, updateDto);

      expect(db.$transaction).toHaveBeenCalled();
      expect(tx.volunteerProfile.update).toHaveBeenCalledWith({
        where: { accountId },
        data: { about: 'Updated about text' },
      });
      expect(tx.volunteerSpecialisation.deleteMany).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(tx.volunteerSpecialisation.createMany).toHaveBeenCalledWith({
        data: [
          { accountId, specialisationId: 'spec-1' },
          { accountId, specialisationId: 'spec-2' },
        ],
      });
    });

    it('skips specialisation transaction when specialisationIds is not provided', async () => {
      const updateDtoAboutOnly = { about: 'Updated about' };

      db.account.findUnique
        .mockResolvedValueOnce({ status: 'active' })
        .mockResolvedValue({
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
      db.volunteerProfile.findUnique.mockResolvedValue({ accountId });

      await service.updateProfile(accountId, updateDtoAboutOnly);

      expect(db.volunteerProfile.update).toHaveBeenCalledWith({
        where: { accountId },
        data: { about: 'Updated about' },
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('skips all DB writes and returns profile when body is empty', async () => {
      const tx = createMockTx();
      db.account.findUnique
        .mockResolvedValueOnce({ status: 'active' })
        .mockResolvedValue(mockProfileResult);
      db.volunteerProfile.findUnique.mockResolvedValue({ accountId });
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      const result = await service.updateProfile(accountId, {});

      expect(db.$transaction).not.toHaveBeenCalled();
      expect(db.volunteerProfile.update).not.toHaveBeenCalled();
      expect(tx.volunteerProfile.update).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('skips volunteerProfile.update inside transaction when about is not provided', async () => {
      const tx = createMockTx();
      const dtoSpecialisationsOnly = { specialisationIds: ['spec-1'] };
      db.account.findUnique
        .mockResolvedValueOnce({ status: 'active' })
        .mockResolvedValue(mockProfileResult);
      db.volunteerProfile.findUnique.mockResolvedValue({ accountId });
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      await service.updateProfile(accountId, dtoSpecialisationsOnly);

      expect(tx.volunteerProfile.update).not.toHaveBeenCalled();
      expect(tx.volunteerSpecialisation.deleteMany).toHaveBeenCalled();
      expect(tx.volunteerSpecialisation.createMany).toHaveBeenCalled();
    });

    it('returns the updated profile from getProfile', async () => {
      const tx = createMockTx();
      db.account.findUnique
        .mockResolvedValueOnce({ status: 'active' })
        .mockResolvedValue(mockProfileResult);
      db.volunteerProfile.findUnique.mockResolvedValue({ accountId });
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      const result = await service.updateProfile(accountId, updateDto);

      expect(result).toMatchObject({
        accountId,
        name: mockProfileResult.name,
        verificationStatus:
          mockProfileResult.volunteerProfile.verificationStatus,
      });
    });

    it('throws ForbiddenException for suspended account', async () => {
      db.account.findUnique.mockResolvedValueOnce({ status: 'suspended' });

      await expect(service.updateProfile(accountId, updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException for banned account', async () => {
      db.account.findUnique.mockResolvedValueOnce({ status: 'banned' });

      await expect(service.updateProfile(accountId, updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────

  describe('updateStatus', () => {
    const accountId = 'test-account-id';

    it('updates availability to true and returns isAvailable', async () => {
      db.account.findUnique.mockResolvedValue({ status: 'active' });
      db.volunteerProfile.findUnique.mockResolvedValue({
        accountId,
        verificationStatus: 'approved',
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
      db.account.findUnique.mockResolvedValue({ status: 'active' });
      db.volunteerProfile.findUnique.mockResolvedValue({
        accountId,
        verificationStatus: 'approved',
        isAvailable: true,
      });
      db.volunteerProfile.update.mockResolvedValue({ isAvailable: false });

      const result = await service.updateStatus(accountId, {
        available: false,
      });

      expect(result).toEqual({ isAvailable: false });
    });

    it('throws NotFoundException when profile does not exist', async () => {
      db.account.findUnique.mockResolvedValue({ status: 'active' });
      db.volunteerProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus(accountId, { available: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when verificationStatus is not approved', async () => {
      db.account.findUnique.mockResolvedValue({ status: 'active' });
      db.volunteerProfile.findUnique.mockResolvedValue({
        accountId,
        verificationStatus: 'pending',
      });

      await expect(
        service.updateStatus(accountId, { available: true }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when verificationStatus is rejected', async () => {
      db.account.findUnique.mockResolvedValue({ status: 'active' });
      db.volunteerProfile.findUnique.mockResolvedValue({
        accountId,
        verificationStatus: 'rejected',
      });

      await expect(
        service.updateStatus(accountId, { available: true }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for suspended account', async () => {
      db.account.findUnique.mockResolvedValue({ status: 'suspended' });

      await expect(
        service.updateStatus(accountId, { available: true }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for banned account', async () => {
      db.account.findUnique.mockResolvedValue({ status: 'banned' });

      await expect(
        service.updateStatus(accountId, { available: true }),
      ).rejects.toThrow(ForbiddenException);
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
      const tx = createMockTx();
      tx.volunteerVerification.findFirst.mockResolvedValue(null);
      db.account.findUnique.mockResolvedValue({ status: 'active' });
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      const result = await service.applyAsVolunteer(accountId, applyDto);

      expect(tx.volunteerVerification.findFirst).toHaveBeenCalledWith({
        where: {
          volunteerId: accountId,
          status: { in: ['pending', 'approved'] },
        },
      });
      expect(tx.volunteerProfile.upsert).toHaveBeenCalledWith({
        where: { accountId },
        update: {
          instituteEmail: applyDto.instituteEmail,
          instituteName: applyDto.instituteName,
          studentId: applyDto.studentId,
          instituteIdImageUrl: applyDto.instituteIdImageUrl,
          grade: applyDto.grade,
          about: applyDto.about,
          verificationStatus: 'pending',
          isAvailable: false,
        },
        create: {
          accountId,
          instituteEmail: applyDto.instituteEmail,
          instituteName: applyDto.instituteName,
          studentId: applyDto.studentId,
          instituteIdImageUrl: applyDto.instituteIdImageUrl,
          grade: applyDto.grade,
          about: applyDto.about,
          verificationStatus: 'pending',
          isAvailable: false,
        },
      });
      expect(tx.volunteerSpecialisation.deleteMany).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(tx.volunteerSpecialisation.createMany).toHaveBeenCalledWith({
        data: [
          { accountId, specialisationId: 'spec-1' },
          { accountId, specialisationId: 'spec-2' },
        ],
      });
      expect(tx.volunteerVerification.create).toHaveBeenCalledWith({
        data: {
          volunteerId: accountId,
          documentUrl: applyDto.instituteIdImageUrl,
          status: 'pending',
        },
      });
      expect(tx.volunteerExperience.upsert).toHaveBeenCalledWith({
        where: { accountId },
        update: {},
        create: { accountId, points: 0 },
      });
      expect(tx.account.update).toHaveBeenCalledWith({
        where: { accountId },
        data: { name: applyDto.name },
      });
      expect(result).toEqual({
        message: 'Application submitted',
        verificationStatus: 'pending',
      });
    });

    it('throws ConflictException when a pending application already exists', async () => {
      const tx = createMockTx();
      tx.volunteerVerification.findFirst.mockResolvedValue({
        volunteerId: accountId,
        status: 'pending',
      });
      db.account.findUnique.mockResolvedValue({ status: 'active' });
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      await expect(
        service.applyAsVolunteer(accountId, applyDto),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when an approved application already exists', async () => {
      const tx = createMockTx();
      tx.volunteerVerification.findFirst.mockResolvedValue({
        volunteerId: accountId,
        status: 'approved',
      });
      db.account.findUnique.mockResolvedValue({ status: 'active' });
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      await expect(
        service.applyAsVolunteer(accountId, applyDto),
      ).rejects.toThrow(ConflictException);
    });

    it('handles optional about field when not provided', async () => {
      const tx = createMockTx();
      tx.volunteerVerification.findFirst.mockResolvedValue(null);
      db.account.findUnique.mockResolvedValue({ status: 'active' });
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      const applyDtoWithoutAbout = {
        name: applyDto.name,
        instituteEmail: applyDto.instituteEmail,
        instituteName: applyDto.instituteName,
        studentId: applyDto.studentId,
        instituteIdImageUrl: applyDto.instituteIdImageUrl,
        grade: applyDto.grade,
        specialisationIds: applyDto.specialisationIds,
      };

      const result = await service.applyAsVolunteer(
        accountId,
        applyDtoWithoutAbout,
      );

      expect(result.verificationStatus).toBe('pending');
      expect(tx.volunteerProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ about: null }),
          update: expect.objectContaining({ about: null }),
        }),
      );
    });

    it('throws ForbiddenException for suspended account', async () => {
      db.account.findUnique.mockResolvedValue({ status: 'suspended' });

      await expect(
        service.applyAsVolunteer(accountId, applyDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for banned account', async () => {
      db.account.findUnique.mockResolvedValue({ status: 'banned' });

      await expect(
        service.applyAsVolunteer(accountId, applyDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
