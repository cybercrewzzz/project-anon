import { Test, TestingModule } from '@nestjs/testing';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';

describe('BlocksController', () => {
  let controller: BlocksController;
  let service: BlocksService;

  const mockBlocksService = {
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    getBlockedUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlocksController],
      providers: [{ provide: BlocksService, useValue: mockBlocksService }],
    }).compile();

    controller = module.get<BlocksController>(BlocksController);
    service = module.get<BlocksService>(BlocksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('blockUser', () => {
    it('should block a user and return success message', async () => {
      const accountId = 'blocker-uuid';
      const dto = { blockedId: 'blocked-uuid' };
      const expected = { message: 'User blocked' };

      mockBlocksService.blockUser.mockResolvedValue(expected);

      const result = await controller.blockUser(accountId, dto);

      expect(result).toEqual(expected);
      expect(service.blockUser).toHaveBeenCalledWith(accountId, dto);
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user and return success message', async () => {
      const accountId = 'blocker-uuid';
      const blockedId = 'blocked-uuid';
      const expected = { message: 'User unblocked' };

      mockBlocksService.unblockUser.mockResolvedValue(expected);

      const result = await controller.unblockUser(accountId, blockedId);

      expect(result).toEqual(expected);
      expect(service.unblockUser).toHaveBeenCalledWith(accountId, blockedId);
    });
  });

  describe('getBlockedUsers', () => {
    it('should return list of blocked users', async () => {
      const accountId = 'blocker-uuid';
      const expected = {
        data: [
          { blockedId: 'blocked-uuid', blockedAt: new Date().toISOString() },
        ],
      };

      mockBlocksService.getBlockedUsers.mockResolvedValue(expected);

      const result = await controller.getBlockedUsers(accountId);

      expect(result).toEqual(expected);
      expect(service.getBlockedUsers).toHaveBeenCalledWith(accountId);
    });
  });
});
