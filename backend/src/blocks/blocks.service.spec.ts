import { Test, TestingModule } from '@nestjs/testing';
import { BlocksService } from './blocks.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('BlocksService', () => {
  let service: BlocksService;

  const mockPrisma = {
    account: {
      findUnique: jest.fn(),
    },
    blocklist: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('blockUser', () => {
    const blockerId = 'blocker-uuid';
    const blockedId = 'blocked-uuid';

    it('should throw BadRequestException when blocking yourself', async () => {
      await expect(
        service.blockUser(blockerId, { blockedId: blockerId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when target account does not exist', async () => {
      mockPrisma.account.findUnique.mockResolvedValue(null);

      await expect(
        service.blockUser(blockerId, { blockedId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when already blocked', async () => {
      mockPrisma.account.findUnique.mockResolvedValue({
        accountId: blockedId,
      });
      mockPrisma.blocklist.findUnique.mockResolvedValue({
        blockerId,
        blockedId,
      });

      await expect(
        service.blockUser(blockerId, { blockedId }),
      ).rejects.toThrow(ConflictException);
    });

    it('should block a user successfully', async () => {
      mockPrisma.account.findUnique.mockResolvedValue({
        accountId: blockedId,
      });
      mockPrisma.blocklist.findUnique.mockResolvedValue(null);
      mockPrisma.blocklist.create.mockResolvedValue({
        blockerId,
        blockedId,
      });

      const result = await service.blockUser(blockerId, { blockedId });

      expect(result).toEqual({ message: 'User blocked' });
      expect(mockPrisma.blocklist.create).toHaveBeenCalledWith({
        data: { blockerId, blockedId },
      });
    });
  });

  describe('unblockUser', () => {
    const blockerId = 'blocker-uuid';
    const blockedId = 'blocked-uuid';

    it('should throw NotFoundException when block does not exist', async () => {
      mockPrisma.blocklist.findUnique.mockResolvedValue(null);

      await expect(
        service.unblockUser(blockerId, blockedId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should unblock a user successfully', async () => {
      mockPrisma.blocklist.findUnique.mockResolvedValue({
        blockerId,
        blockedId,
      });
      mockPrisma.blocklist.delete.mockResolvedValue({
        blockerId,
        blockedId,
      });

      const result = await service.unblockUser(blockerId, blockedId);

      expect(result).toEqual({ message: 'User unblocked' });
    });
  });

  describe('getBlockedUsers', () => {
    it('should return a list of blocked users', async () => {
      const blockerId = 'blocker-uuid';
      const blockedAt = new Date();
      mockPrisma.blocklist.findMany.mockResolvedValue([
        { blockedId: 'user-1', blockedAt },
        { blockedId: 'user-2', blockedAt },
      ]);

      const result = await service.getBlockedUsers(blockerId);

      expect(result).toEqual({
        data: [
          { blockedId: 'user-1', blockedAt },
          { blockedId: 'user-2', blockedAt },
        ],
      });
      expect(mockPrisma.blocklist.findMany).toHaveBeenCalledWith({
        where: { blockerId },
        select: { blockedId: true, blockedAt: true },
        orderBy: { blockedAt: 'desc' },
      });
    });

    it('should return empty data when no users are blocked', async () => {
      mockPrisma.blocklist.findMany.mockResolvedValue([]);

      const result = await service.getBlockedUsers('blocker-uuid');

      expect(result).toEqual({ data: [] });
    });
  });
});
