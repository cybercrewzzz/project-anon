import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { PrismaService } from '../prisma/prisma.service';

type MockPrismaService = {
  account: {
    findUnique: jest.Mock;
  };
  blocklist: {
    findUnique: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
    findMany: jest.Mock;
  };
};

describe('BlocksService', () => {
  let service: BlocksService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const prismaMock: MockPrismaService = {
      account: {
        findUnique: jest.fn(),
      },
      blocklist: {
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    prisma = module.get<MockPrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('blockUser', () => {
    it('throws BadRequestException when trying to block yourself', async () => {
      await expect(
        service.blockUser('user-1', { blockedId: 'user-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.account.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target account does not exist', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(
        service.blockUser('user-1', { blockedId: 'nonexistent-user' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when already blocked', async () => {
      prisma.account.findUnique.mockResolvedValue({
        accountId: 'user-2',
      });
      prisma.blocklist.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.blockUser('user-1', { blockedId: 'user-2' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a block successfully', async () => {
      prisma.account.findUnique.mockResolvedValue({
        accountId: 'user-2',
      });
      prisma.blocklist.findUnique.mockResolvedValue(null);
      prisma.blocklist.create.mockResolvedValue({
        blockerId: 'user-1',
        blockedId: 'user-2',
      });

      const result = await service.blockUser('user-1', {
        blockedId: 'user-2',
      });

      expect(result).toEqual({ message: 'User blocked' });
      expect(prisma.blocklist.create).toHaveBeenCalledWith({
        data: {
          blockerId: 'user-1',
          blockedId: 'user-2',
        },
      });
    });
  });

  describe('unblockUser', () => {
    it('throws NotFoundException when block does not exist', async () => {
      prisma.blocklist.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.unblockUser('user-1', 'user-2'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('unblocks a user successfully', async () => {
      prisma.blocklist.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.unblockUser('user-1', 'user-2');

      expect(result).toEqual({ message: 'User unblocked' });
      expect(prisma.blocklist.deleteMany).toHaveBeenCalledWith({
        where: {
          blockerId: 'user-1',
          blockedId: 'user-2',
        },
      });
    });
  });

  describe('listBlocked', () => {
    it('returns an empty list when no users are blocked', async () => {
      prisma.blocklist.findMany.mockResolvedValue([]);

      const result = await service.listBlocked('user-1');

      expect(result).toEqual({ data: [] });
    });

    it('returns blocked users with timestamps', async () => {
      const blockedAt = new Date('2026-03-01T10:00:00Z');
      prisma.blocklist.findMany.mockResolvedValue([
        { blockedId: 'user-2', blockedAt },
        { blockedId: 'user-3', blockedAt },
      ]);

      const result = await service.listBlocked('user-1');

      expect(result).toEqual({
        data: [
          { blockedId: 'user-2', blockedAt: '2026-03-01T10:00:00.000Z' },
          { blockedId: 'user-3', blockedAt: '2026-03-01T10:00:00.000Z' },
        ],
      });
    });
  });
});
