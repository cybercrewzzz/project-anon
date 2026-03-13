import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    accountRole: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('15m'),
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email is taken', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: '1',
      });
      await expect(
        service.register({
          email: 'test@test.com',
          password: 'pwd',
          ageRange: 'range_21_26' as any,
        }),
      ).rejects.toThrow('Email already registered');
    });

    it('should throw InternalServerErrorException if user role not found', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.role.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.register({
          email: 'test@test.com',
          password: 'pwd',
          ageRange: 'range_21_26' as any,
        }),
      ).rejects.toThrow('User role not found in database. Run seed first.');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for non-existent account or missing passwordHash', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.login({ email: 'test@test.com', password: 'pwd' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw ForbiddenException if account is banned', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: '1',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummy$dummy',
        status: 'banned',
        accountRoles: [],
      });
      (argon2.verify as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        service.login({ email: 'test@test.com', password: 'pwd' }),
      ).rejects.toThrow('Account has been banned');
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token and return logged out message', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValueOnce({
        count: 1,
      });
      const result = await service.logout(
        { refreshToken: 'some-token' },
        'acc-123',
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          accountId: 'acc-123',
          isRevoked: false,
        }),
        data: { isRevoked: true },
      });
      expect(result).toEqual({ message: 'Logged out' });
    });
  });
});
