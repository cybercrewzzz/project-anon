import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
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
    $transaction: jest.fn(),
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
    it('should generate OTP and store in redis if account exists', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce({
        accountId: 'acc-123',
        email: 'test@test.com',
      });
      mockRedisService.set.mockResolvedValueOnce('OK');

      const result = await service.forgotPassword({ email: 'test@test.com' });

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'pwd-reset-otp:test@test.com',
        expect.any(String),
        'EX',
        300,
      );
      expect(result.message).toContain('OTP has been sent');
    });

    it('should return success message even if account does not exist', async () => {
      mockPrismaService.account.findUnique.mockResolvedValueOnce(null);

      const result = await service.forgotPassword({ email: 'nonexistent@test.com' });

      expect(mockRedisService.set).not.toHaveBeenCalled();
      expect(result.message).toContain('OTP has been sent');
    });
  });

  describe('verifyOtp', () => {
    it('should throw ForbiddenException if too many attempts', async () => {
      mockRedisService.get.mockResolvedValueOnce('5'); // 5 attempts

      await expect(
        service.verifyOtp({ email: 'test@test.com', otp: '123456' }),
      ).rejects.toThrow('Too many failed attempts.');
    });

    it('should throw UnauthorizedException and increment counter if OTP is wrong', async () => {
      mockRedisService.get.mockResolvedValueOnce(null); // No previous attempts
      mockRedisService.get.mockResolvedValueOnce('wrong-otp');
      mockRedisService.incr.mockResolvedValueOnce(1);
      mockRedisService.expire.mockResolvedValueOnce(1);

      await expect(
        service.verifyOtp({ email: 'test@test.com', otp: '123456' }),
      ).rejects.toThrow('Invalid or expired OTP.');

      expect(mockRedisService.incr).toHaveBeenCalledWith('pwd-reset-attempts:test@test.com');
      expect(mockRedisService.expire).toHaveBeenCalled();
    });

    it('should return reset token and cleanup OTP/attempts if correct', async () => {
      mockRedisService.get.mockResolvedValueOnce(null); // No attempts
      mockRedisService.get.mockResolvedValueOnce('123456'); // 6-digit
      mockRedisService.del.mockResolvedValue(1);
      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.verifyOtp({ email: 'test@test.com', otp: '123456' });

      expect(mockRedisService.del).toHaveBeenCalledWith('pwd-reset-otp:test@test.com');
      expect(mockRedisService.del).toHaveBeenCalledWith('pwd-reset-attempts:test@test.com');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'pwd-reset-token:test@test.com',
        expect.any(String),
        'EX',
        900,
      );
      expect(result).toHaveProperty('resetToken');
    });
  });

  describe('resetPassword', () => {
    it('should throw UnauthorizedException if reset token is invalid', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword({
          email: 'test@test.com',
          resetToken: 'invalid',
          newPassword: 'new-password-123',
        }),
      ).rejects.toThrow('Invalid or expired reset token.');
    });

    it('should update password and cleanup token if valid', async () => {
      mockRedisService.get.mockResolvedValueOnce('valid-token');
      mockPrismaService.account.update.mockResolvedValueOnce({});
      mockRedisService.del.mockResolvedValueOnce(1);

      const result = await service.resetPassword({
        email: 'test@test.com',
        resetToken: 'valid-token',
        newPassword: 'new-password-123',
      });

      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        data: { passwordHash: 'hashed_password' },
      });
      expect(mockRedisService.del).toHaveBeenCalledWith('pwd-reset-token:test@test.com');
      expect(result.message).toContain('successfully reset');
    });
  });
});
