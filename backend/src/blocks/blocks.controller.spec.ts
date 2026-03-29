import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateBlockSchema, BlockParamsSchema } from './dto/create-block.dto';

describe('BlocksController', () => {
  let controller: BlocksController;
  let service: jest.Mocked<BlocksService>;

  const mockBlocksService = {
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    listBlocked: jest.fn(),
  } as unknown as jest.Mocked<BlocksService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlocksController],
      providers: [
        {
          provide: BlocksService,
          useValue: mockBlocksService,
        },
      ],
    }).compile();

    controller = module.get<BlocksController>(BlocksController);
    service = module.get(BlocksService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('block', () => {
    it('delegates to BlocksService.blockUser with blockerId from JWT and DTO', async () => {
      const blockerId = '2f1a1725-157d-4e84-91d5-015786561dc7';
      const dto = { blockedId: '168ce48c-c8f6-4b0e-ba56-e018f4a639f3' };
      const expected = { message: 'User blocked' };
      service.blockUser.mockResolvedValue(expected);

      const result = await controller.block(blockerId, dto);

      expect(service.blockUser).toHaveBeenCalledWith(blockerId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('list', () => {
    it('delegates to BlocksService.listBlocked with blockerId from JWT', async () => {
      const blockerId = '2f1a1725-157d-4e84-91d5-015786561dc7';
      const expected = { data: [] };
      service.listBlocked.mockResolvedValue(expected);

      const result = await controller.list(blockerId);

      expect(service.listBlocked).toHaveBeenCalledWith(blockerId);
      expect(result).toEqual(expected);
    });
  });

  describe('unblock', () => {
    it('delegates to BlocksService.unblockUser with blockerId and blockedId', async () => {
      const blockerId = '2f1a1725-157d-4e84-91d5-015786561dc7';
      const params = { blockedId: '168ce48c-c8f6-4b0e-ba56-e018f4a639f3' };
      const expected = { message: 'User unblocked' };
      service.unblockUser.mockResolvedValue(expected);

      const result = await controller.unblock(blockerId, params);

      expect(service.unblockUser).toHaveBeenCalledWith(
        blockerId,
        params.blockedId,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('validation pipes', () => {
    it('rejects invalid block body payload', () => {
      const bodyPipe = new ZodValidationPipe(CreateBlockSchema);

      expect(() =>
        bodyPipe.transform({
          blockedId: 'not-a-uuid',
        }),
      ).toThrow(BadRequestException);
    });

    it('accepts valid block body payload', () => {
      const bodyPipe = new ZodValidationPipe(CreateBlockSchema);

      const result = bodyPipe.transform({
        blockedId: '168ce48c-c8f6-4b0e-ba56-e018f4a639f3',
      });

      expect(result).toEqual({
        blockedId: '168ce48c-c8f6-4b0e-ba56-e018f4a639f3',
      });
    });

    it('rejects invalid blockedId param', () => {
      const paramsPipe = new ZodValidationPipe(BlockParamsSchema);

      expect(() =>
        paramsPipe.transform({
          blockedId: 'invalid-id',
        }),
      ).toThrow(BadRequestException);
    });
  });
});
