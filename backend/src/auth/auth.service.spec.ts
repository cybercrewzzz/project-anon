import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import * as argon2 from 'argon2';
import { UnauthorizedException, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';

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
      update: jest.fn(),
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
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
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
    incr: jest.fn(),
    expire: jest.fn(),
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
      mockPrismaService.account.findUnique.mockResolvedValueOnce({ accountId: '1' });
      await expect(
        service.register({
          email: 'test@test.com',
          password: 'pwd',
          ageRange: 'range_21_26' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should normalize email before lookup and creation', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.role.findUnique.mockResolvedValueOnce({ roleId: 'role-1' });
      mockPrismaService.account.create.mockResolvedValueOnce({ accountId: 'acc-1', email: 'test@test.com' });

      await service.register({
        email: '  TEST@test.com  ',
        password: 'pwd',
        ageRange: 'range_21_26' as any,
      });

      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
      expect(mockPrismaService.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'test@test.com' }),
        })
      );
    });
  });

  describe('login', () => {
    it('should normalize email and check credentials', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: 'acc-123',
        email: 'test@test.com',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummy$dummy',
        status: 'active',
        accountRoles: [{ role: { name: 'user' } }],
      });
      (argon2.verify as jest.Mock).mockResolvedValueOnce(true);

      await service.login({ email: '  TEST@test.com  ', password: 'pwd' });

      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        include: expect.anything(),
      });
    });
  });

  describe('forgotPassword', () => {
    it('should generate 6-digit OTP and store normalized email in redis', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: 'acc-123',
        email: 'test@test.com',
      });
      mockRedisService.set.mockResolvedValueOnce('OK');

      const result = await service.forgotPassword({ email: '  TEST@test.com  ' });

      expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'pwd-reset-otp:test@test.com',
        expect.stringMatching(/^\d{6}$/),
        'EX',
        300,
      );
      expect(result.message).toContain('OTP has been sent');
    });
  });

  describe('verifyOtp', () => {
    it('should throw ForbiddenException if too many attempts', async () => {
      mockRedisService.get.mockResolvedValueOnce('5');
      await expect(
        service.verifyOtp({ email: 'test@test.com', otp: '123456' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return reset token and store hashed token on success', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockRedisService.get.mockResolvedValueOnce('123456');
      mockRedisService.del.mockResolvedValue(1);
      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.verifyOtp({ email: '  TEST@test.com  ', otp: '123456' });

      expect(mockRedisService.del).toHaveBeenCalledWith('pwd-reset-otp:test@test.com');
      expect(mockRedisService.del).toHaveBeenCalledWith('pwd-reset-attempts:test@test.com');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'pwd-reset-token:test@test.com',
        expect.stringMatching(/^[a-f0-9]{64}$/),
        'EX',
        900,
      );
      expect(result).toHaveProperty('resetToken');
    });
  });

  describe('resetPassword', () => {
    it('should update password and cleanup if token hash matches', async () => {
      const resetToken = 'valid-token';
      const expectedHash = (service as any).hashToken(resetToken);

      mockRedisService.get.mockResolvedValueOnce(expectedHash);
      mockPrismaService.account.update.mockResolvedValueOnce({});
      mockRedisService.del.mockResolvedValueOnce(1);

      const result = await service.resetPassword({
        email: '  TEST@test.com  ',
        resetToken,
        newPassword: 'new-password-123',
      });

      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        data: { passwordHash: 'hashed_password' },
      });
      expect(mockRedisService.del).toHaveBeenCalledWith('pwd-reset-token:test@test.com');
      expect(result.message).toContain('successfully reset');
    });

    it('should throw NotFoundException if account is missing during update', async () => {
      const resetToken = 'valid-token';
      const expectedHash = (service as any).hashToken(resetToken);

      mockRedisService.get.mockResolvedValueOnce(expectedHash);
      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';
      mockPrismaService.account.update.mockRejectedValueOnce(prismaError);
      mockRedisService.del.mockResolvedValueOnce(1);

      await expect(
        service.resetPassword({
          email: 'test@test.com',
          resetToken,
          newPassword: 'new-password-123',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockRedisService.del).toHaveBeenCalledWith('pwd-reset-token:test@test.com');
    });
  });
});
