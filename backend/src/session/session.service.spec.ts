import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MatchingService } from './matching.service';
import { TicketService } from './ticket.service';

describe('SessionService', () => {
  let service: SessionService;
  let prisma: any;
  let redis: any;
  let tickets: any;

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
      set: jest.fn(),
      hset: jest.fn(),
      hgetall: jest.fn(),
      hsetnx: jest.fn(),
      smembers: jest.fn(),
      expire: jest.fn(),
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
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    tickets = module.get(TicketService);
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
      redis.hgetall.mockResolvedValue({
        seekerId: 'seeker-1',
        status: 'waiting',
        listenerId: '',
      });
      redis.hsetnx.mockResolvedValue(0);

      await expect(service.accept('session-abc', 'volunteer-1')).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(redis.hsetnx).toHaveBeenCalledWith(
        'session:session-abc',
        'listenerId',
        'volunteer-1',
      );
      expect(prisma.chatSession.update).not.toHaveBeenCalled();
    });

    it('rolls back redis claim when volunteer is blocked by seeker', async () => {
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

      await expect(service.accept('session-roll', 'volunteer-3')).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(redis.hset).toHaveBeenCalledWith('session:session-roll', {
        listenerId: '',
        status: 'waiting',
      });
      expect(prisma.chatSession.update).not.toHaveBeenCalled();
    });
  });
});
