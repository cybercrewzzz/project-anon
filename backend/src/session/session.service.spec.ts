import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MatchingService } from './matching.service';
import { TicketService } from './ticket.service';

type MockPrismaService = {
  chatSession: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  userProblem: {
    create: jest.Mock;
    update: jest.Mock;
  };
  accountLanguage: {
    findMany: jest.Mock;
  };
  blocklist: {
    findFirst: jest.Mock;
  };
  category: {
    findUnique: jest.Mock;
  };
  volunteerProfile: {
    findMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

type MockRedisService = {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  eval: jest.Mock;
  hset: jest.Mock;
  hgetall: jest.Mock;
  hsetnx: jest.Mock;
  smembers: jest.Mock;
  expire: jest.Mock;
  multi: jest.Mock;
};

type MockTicketService = {
  tryReserve: jest.Mock;
  releaseReserved: jest.Mock;
  getRemaining: jest.Mock;
};

describe('SessionService', () => {
  let service: SessionService;
  let prisma: MockPrismaService;
  let redis: MockRedisService;
  let tickets: MockTicketService;

  beforeEach(async () => {
    const prismaMock = {
      chatSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      userProblem: {
        create: jest.fn(),
        update: jest.fn(),
      },
      accountLanguage: {
        findMany: jest.fn(),
      },
      blocklist: {
        findFirst: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
      volunteerProfile: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const redisMock = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'), // Default: lock acquired successfully
      del: jest.fn().mockResolvedValue(1), // For lock release
      eval: jest.fn().mockResolvedValue(1), // For atomic lock release (Lua script)
      hset: jest.fn(),
      hgetall: jest.fn(),
      hsetnx: jest.fn(),
      smembers: jest.fn(),
      expire: jest.fn(),
      multi: jest.fn().mockReturnValue({
        hdel: jest.fn().mockReturnThis(),
        hset: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'OK'],
          [null, 1],
        ]),
      }),
    };

    const matchingMock = {
      findBestVolunteer: jest.fn(),
    };

    const ticketMock = {
      tryReserve: jest.fn(),
      releaseReserved: jest.fn(),
      getRemaining: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: RedisService,
          useValue: redisMock,
        },
        {
          provide: MatchingService,
          useValue: matchingMock,
        },
        {
          provide: TicketService,
          useValue: ticketMock,
        },
        {
          provide: 'BullQueue_sessions',
          useValue: {
            add: jest.fn(),
            getJob: jest.fn(),
          },
        },
        {
          provide: 'BullQueue_notifications',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prisma = module.get<MockPrismaService>(PrismaService);
    redis = module.get<MockRedisService>(RedisService);
    tickets = module.get<MockTicketService>(TicketService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('connect', () => {
    it('returns cached result for idempotency replay and skips side effects', async () => {
      const cached = {
        sessionId: 'session-1',
        volunteerId: 'vol-1',
        wsRoom: 'session:session-1',
        turnCredentials: {
          urls: ['turn:example.com:3478'],
          username: 'u',
          credential: 'c',
        },
      };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const dto = {
        categoryId: '11111111-1111-4111-8111-111111111111',
        feelingLevel: 3,
        customLabel: 'Anxious',
        idempotencyKey: '22222222-2222-4222-8222-222222222222',
      };

      const result = await service.connect('seeker-1', dto);

      expect(result).toEqual(cached);
      expect(tickets.tryReserve).not.toHaveBeenCalled();
      expect(prisma.chatSession.findFirst).not.toHaveBeenCalled();
    });

    it('throws when seeker has no remaining tickets', async () => {
      redis.get.mockResolvedValue(null);
      prisma.chatSession.findFirst.mockResolvedValue(null);
      tickets.tryReserve.mockResolvedValue(false);

      const dto = {
        categoryId: '33333333-3333-4333-8333-333333333333',
        feelingLevel: 2,
        idempotencyKey: '44444444-4444-4444-8444-444444444444',
      };

      await expect(service.connect('seeker-2', dto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(tickets.tryReserve).toHaveBeenCalledWith('seeker-2');
      expect(prisma.userProblem.create).not.toHaveBeenCalled();
    });
  });

  describe('accept', () => {
    it('throws conflict when another volunteer already claimed the session', async () => {
      prisma.chatSession.findFirst.mockResolvedValue(null); // No active volunteer session
      redis.hgetall.mockResolvedValue({
        seekerId: 'seeker-1',
        status: 'waiting',
        listenerId: '',
      });
      redis.hsetnx.mockResolvedValue(0);

      await expect(
        service.accept('session-abc', 'volunteer-1'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(redis.hsetnx).toHaveBeenCalledWith(
        'session:session-abc',
        'listenerId',
        'volunteer-1',
      );
      expect(prisma.chatSession.update).not.toHaveBeenCalled();
    });

    it('rolls back redis claim when volunteer is blocked by seeker', async () => {
      prisma.chatSession.findFirst.mockResolvedValue(null); // No active volunteer session
      redis.hgetall.mockResolvedValue({
        seekerId: 'seeker-3',
        status: 'waiting',
        listenerId: '',
      });
      redis.hsetnx.mockResolvedValue(1);
      prisma.blocklist.findFirst.mockResolvedValue({
        blockerId: 'seeker-3',
        blockedId: 'volunteer-3',
      });

      await expect(
        service.accept('session-roll', 'volunteer-3'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      // Verify that multi() was called to roll back the claim
      expect(redis.multi).toHaveBeenCalled();
      expect(prisma.chatSession.update).not.toHaveBeenCalled();
    });
  });
});
