import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import * as argon2 from 'argon2';
import { createHash } from 'crypto';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  verify: jest.fn(),
  argon2id: 2,
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
    $transaction: (cb: (prisma: any) => unknown) => cb(mockPrismaService),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('15m'),
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
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
          ageRange: 'range_21_26' as never,
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
          ageRange: 'range_21_26' as never,
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

    it('should throw UnauthorizedException when password hash format is invalid', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: '1',
        passwordHash: '$2b$10$invalidBcryptHashHere',
        status: 'active',
        accountRoles: [{ role: { name: 'user' } }],
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'pwd' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw InternalServerErrorException when argon2.verify rejects', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: '1',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummy$dummy',
        status: 'active',
        accountRoles: [{ role: { name: 'user' } }],
      });
      (argon2.verify as jest.Mock).mockRejectedValueOnce(
        new Error('Async error'),
      );

      await expect(
        service.login({ email: 'test@test.com', password: 'pwd' }),
      ).rejects.toThrow('Internal server error during authentication');
    });

    it('should throw InternalServerErrorException when argon2.verify synchronously throws', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: '1',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummy$dummy',
        status: 'active',
        accountRoles: [{ role: { name: 'user' } }],
      });
      (argon2.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Sync error');
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'pwd' }),
      ).rejects.toThrow('Internal server error during authentication');
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

  describe('forgotPassword', () => {
    it('should generate OTP and store hash in redis if account exists', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: 'acc-123',
        email: 'test@test.com',
      });
      mockRedisService.set.mockResolvedValueOnce('OK');

      const result = await service.forgotPassword({ email: 'test@test.com' });

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'pwd-reset-otp:acc-123',
        expect.any(String),
        'EX',
        300,
      );
      expect(result.message).toContain('OTP has been sent');
    });
  });

  describe('verifyOtp', () => {
    it('should throw UnauthorizedException if OTP is wrong', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: 'acc-123',
        email: 'test@test.com',
      });
      mockRedisService.get.mockResolvedValueOnce('wrong-hash');

      await expect(
        service.verifyOtp({ email: 'test@test.com', otp: '123456' }),
      ).rejects.toThrow('Invalid or expired OTP.');
    });

    it('should return reset token if OTP is correct', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: 'acc-123',
        email: 'test@test.com',
      });
      // The service hashes the OTP. We need to mock get to return that hash.
      const otp = '123456';
      const otpHash = createHash('sha256').update(otp).digest('hex');
      mockRedisService.get.mockResolvedValueOnce(otpHash);
      mockRedisService.del.mockResolvedValueOnce(1);
      mockRedisService.set.mockResolvedValueOnce('OK');

      const result = await service.verifyOtp({ email: 'test@test.com', otp });

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'pwd-reset-otp:acc-123',
      );
      expect(result).toHaveProperty('resetToken');
    });
  });
});
