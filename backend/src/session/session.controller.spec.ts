import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ConnectSessionSchema } from './dto/session-connect.dto';
import {
  RateSessionBodySchema,
  RateSessionParamsSchema,
} from './dto/sessionid-rate.dto';

describe('SessionController', () => {
  let controller: SessionController;
  let service: jest.Mocked<SessionService>;

  const mockSessionService = {
    connect: jest.fn(),
    accept: jest.fn(),
    rate: jest.fn(),
    getHistory: jest.fn(),
    getTickets: jest.fn(),
  } as unknown as jest.Mocked<SessionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    controller = module.get<SessionController>(SessionController);
    service = module.get(SessionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('connect', () => {
    it('delegates to SessionService.connect with accountId from user and DTO', async () => {
      const user = {
        accountId: '2f1a1725-157d-4e84-91d5-015786561dc7',
        roles: ['user'],
      };
      const dto = {
        categoryId: '6f5575db-1334-4bd3-8ece-f41026f15029',
        feelingLevel: 3,
        customLabel: 'Need to talk',
        idempotencyKey: '168ce48c-c8f6-4b0e-ba56-e018f4a639f3',
      };
      const expected = {
        sessionId: 'e228d63a-1ba4-43f4-8678-a61114f0da59',
        status: 'queued',
      };
      service.connect.mockResolvedValue(expected as never);

      const result = await controller.connect(user as never, dto);

      expect(service.connect).toHaveBeenCalledWith(user.accountId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('validation pipes', () => {
    it('rejects invalid connect body payload', () => {
      const bodyPipe = new ZodValidationPipe(ConnectSessionSchema);

      expect(() =>
        bodyPipe.transform({
          categoryId: 'not-a-uuid',
          feelingLevel: 7,
          idempotencyKey: 'also-not-a-uuid',
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects invalid rate params and body payload', () => {
      const paramsPipe = new ZodValidationPipe(RateSessionParamsSchema);
      const bodyPipe = new ZodValidationPipe(RateSessionBodySchema);

      expect(() =>
        paramsPipe.transform({
          sessionId: 'invalid-id',
        }),
      ).toThrow(BadRequestException);

      expect(() =>
        bodyPipe.transform({
          rating: 0,
          starred: 'yes',
        }),
      ).toThrow(BadRequestException);
    });
  });
});
