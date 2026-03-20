import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MatchingService } from './matching.service';
import { TicketService } from './ticket.service';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: {
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
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            hset: jest.fn(),
            hgetall: jest.fn(),
            hsetnx: jest.fn(),
            smembers: jest.fn(),
            expire: jest.fn(),
          },
        },
        {
          provide: MatchingService,
          useValue: {
            findBestVolunteer: jest.fn(),
          },
        },
        {
          provide: TicketService,
          useValue: {
            tryReserve: jest.fn(),
            releaseReserved: jest.fn(),
            getRemaining: jest.fn(),
          },
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
