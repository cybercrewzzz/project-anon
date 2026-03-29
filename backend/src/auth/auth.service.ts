import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomUUID, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { RegisterVolunteerDto } from './dto/register-volunteer.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { generateUniqueNickname } from '../common/utils/nickname-generator.js';
import { AgeRange, Prisma } from '../generated/prisma/client.js';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  // ── Register ──────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    // Check if email is taken (including by admin accounts)
    const existingAccount = await this.prisma.account.findUnique({
      where: { email },
    });

    if (existingAccount) {
      throw new ConflictException('Email already registered');
    }

    // Hash password with argon2id
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    // Generate unique nickname
    const nickname = await generateUniqueNickname(this.prisma);

    // Find the user role
    const userRole = await this.prisma.role.findUnique({
      where: { name: 'user' },
    });

    if (!userRole) {
      throw new InternalServerErrorException(
        'User role not found in database. Run seed first.',
      );
    }

    // Create account + assign user role in a transaction
    const account = await this.prisma.$transaction(async (tx) => {
      const newAccount = await tx.account.create({
        data: {
          email,
          passwordHash,
          name: null,
          nickname,
          ageRange: dto.ageRange as AgeRange,
          status: 'active',
        },
      });

      await tx.accountRole.create({
        data: {
          accountId: newAccount.accountId,
          roleId: userRole.roleId,
        },
      });

      return newAccount;
    });

    const roles = ['user'];

    // Generate token pair
    const { accessToken, refreshToken } = await this.generateTokens(
      account.accountId,
      roles,
    );

    // Store refresh token
    await this.storeRefreshToken(account.accountId, refreshToken);

    return {
      accessToken,
      refreshToken,
      account: {
        accountId: account.accountId,
        email: account.email,
        nickname: account.nickname,
        roles,
      },
    };
  }

  // ── Register Volunteer ─────────────────────────────────────────────

  async registerVolunteer(dto: RegisterVolunteerDto) {
    const email = this.normalizeEmail(dto.email);
    // Check if email is taken
    const existingAccount = await this.prisma.account.findUnique({
      where: { email },
    });

    if (existingAccount) {
      throw new ConflictException('Email already registered');
    }

    // Hash password with argon2id
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    // Generate unique nickname
    const nickname = await generateUniqueNickname(this.prisma);

    // Find the volunteer role
    const volunteerRole = await this.prisma.role.findUnique({
      where: { name: 'volunteer' },
    });

    if (!volunteerRole) {
      throw new InternalServerErrorException(
        'Volunteer role not found in database. Run seed first.',
      );
    }

    // Create account + assign volunteer role in a transaction
    const account = await this.prisma.$transaction(async (tx) => {
      const newAccount = await tx.account.create({
        data: {
          email,
          passwordHash,
          name: dto.name,
          nickname,
          status: 'active',
        },
      });

      await tx.accountRole.create({
        data: {
          accountId: newAccount.accountId,
          roleId: volunteerRole.roleId,
        },
      });

      return newAccount;
    });

    const roles = ['volunteer'];

    // Generate token pair
    const { accessToken, refreshToken } = await this.generateTokens(
      account.accountId,
      roles,
    );

    // Store refresh token
    await this.storeRefreshToken(account.accountId, refreshToken);

    return {
      accessToken,
      refreshToken,
      account: {
        accountId: account.accountId,
        email: account.email,
        nickname: account.nickname,
        name: account.name,
        roles,
      },
    };
  }

  // ── Login ─────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    // Find account by email
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: {
        accountRoles: {
          include: { role: true },
        },
      },
    });

    if (!account || !account.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    let passwordValid = false;
    if (account.passwordHash.startsWith('$argon2')) {
      try {
        passwordValid = await argon2.verify(account.passwordHash, dto.password);
      } catch {
        throw new InternalServerErrorException(
          'Internal server error during authentication',
        );
      }
    }

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (account.status === 'banned') {
      throw new ForbiddenException('Account has been banned');
    }
    if (account.status === 'suspended') {
      throw new ForbiddenException('Account is suspended');
    }

    // Get all roles
    const roles = account.accountRoles.map((ar) => ar.role.name);

    // Generate token pair
    const { accessToken, refreshToken } = await this.generateTokens(
      account.accountId,
      roles,
    );

    // Store refresh token
    await this.storeRefreshToken(account.accountId, refreshToken);

    return {
      accessToken,
      refreshToken,
      account: {
        accountId: account.accountId,
        email: account.email,
        nickname: account.nickname,
        name: account.name,
        roles,
      },
    };
  }

  // ── Forgot Password ───────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    // 1. Check if account exists
    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      // Don't reveal if account exists or not
      return { message: 'If an account exists, an OTP has been sent.' };
    }

    // 2. Generate a 6-digit OTP (100000 - 999999)
    const otp = randomInt(100000, 1000000).toString();

    // 3. Store OTP in Redis and set an expiration (e.g., 5 minutes)
    const redisKey = `pwd-reset-otp:${email}`;
    await this.redis.set(redisKey, otp, 'EX', 5 * 60);

    // 4. (Simulated) Send the OTP to the user's email
    // In a real application, inject an EmailService and send here.
    this.logger.debug(
      `[SIMULATED EMAIL] Password reset OTP for ${account.email}: ${otp}`,
    );
    this.logger.log(`Password reset OTP sent to ${account.email}`);

    return { message: 'If an account exists, an OTP has been sent.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = this.normalizeEmail(dto.email);
    const attemptsKey = `pwd-reset-attempts:${email}`;
    const otpKey = `pwd-reset-otp:${email}`;

    // 1. Check for lockout
    const attempts = await this.redis.get(attemptsKey);
    if (attempts && parseInt(attempts, 10) >= 5) {
      throw new ForbiddenException(
        'Too many failed attempts. Please try again after 15 minutes.',
      );
    }

    // 2. Retrieve the stored OTP
    const storedOtp = await this.redis.get(otpKey);

    if (!storedOtp || storedOtp !== dto.otp) {
      // Increment and set/extend attempts counter with 15-minute TTL
      const currentAttempts = (await this.redis.incr(
        attemptsKey,
      )) as unknown as number;
      if (currentAttempts === 1) {
        await this.redis.expire(attemptsKey, 15 * 60);
      }
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    // 3. Success: Cleanup OTP and attempt counter
    await Promise.all([this.redis.del(otpKey), this.redis.del(attemptsKey)]);

    // Generate a temporary reset token valid for 15 minutes.
    const resetToken = randomUUID();
    const tokenHash = this.hashToken(resetToken);
    await this.redis.set(`pwd-reset-token:${email}`, tokenHash, 'EX', 15 * 60);

    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    const redisKey = `pwd-reset-token:${email}`;
    const storedTokenHash = await this.redis.get(redisKey);

    if (
      !storedTokenHash ||
      storedTokenHash !== this.hashToken(dto.resetToken)
    ) {
      throw new UnauthorizedException('Invalid or expired reset token.');
    }

    // Token is valid. Hash the new password and update the DB.
    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    try {
      await this.prisma.account.update({
        where: { email },
        data: { passwordHash },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Account not found.');
      }
      throw error;
    } finally {
      // Always remove the reset token once used (or if the account is gone).
      await this.redis.del(redisKey);
    }

    // Optionally revoke all existing sessions to force re-login.
    // (Skipping for now to keep it simple, but recommended in prod).

    return { message: 'Password has been successfully reset.' };
  }

  // ── Refresh ───────────────────────────────────────────────────────

  async refresh(dto: RefreshTokenDto) {
    // Hash the incoming refresh token to look it up
    const tokenHash = this.hashToken(dto.refreshToken);

    // Find the refresh token record
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: {
        account: {
          include: {
            accountRoles: {
              include: { role: true },
            },
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if already revoked (possible token reuse attack)
    if (storedToken.isRevoked) {
      // Token reuse detected! Revoke ALL tokens in this family
      await this.prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException(
        'Token reuse detected. All sessions revoked for security.',
      );
    }

    // Check account status
    if (storedToken.account.status === 'banned') {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { isRevoked: true },
      });
      throw new ForbiddenException('Account has been banned');
    }
    if (storedToken.account.status === 'suspended') {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { isRevoked: true },
      });
      throw new ForbiddenException('Account is suspended');
    }

    // Check expiry
    if (new Date() > storedToken.expiresAt) {
      // Revoke expired token
      await this.prisma.refreshToken.update({
        where: { tokenId: storedToken.tokenId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    const roles = storedToken.account.accountRoles.map((ar) => ar.role.name);

    // Rotate: revoke old token, create new pair
    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(storedToken.accountId, roles);

    // Atomically revoke old token (isRevoked: false guard prevents double-rotation)
    // then store the new one in the same family.
    await this.prisma.$transaction(async (tx) => {
      const revoked = await tx.refreshToken.updateMany({
        where: { tokenId: storedToken.tokenId, isRevoked: false },
        data: { isRevoked: true },
      });

      if (revoked.count === 0) {
        throw new UnauthorizedException(
          'Refresh token already used or revoked',
        );
      }

      await tx.refreshToken.create({
        data: {
          accountId: storedToken.accountId,
          tokenHash: this.hashToken(newRefreshToken),
          expiresAt: this.getRefreshExpiry(),
          familyId: storedToken.familyId,
        },
      });
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  // ── Logout ────────────────────────────────────────────────────────

  async logout(dto: LogoutDto, accountId: string) {
    const tokenHash = this.hashToken(dto.refreshToken);

    // Revoke the refresh token
    const result = await this.prisma.refreshToken.updateMany({
      where: { tokenHash, accountId, isRevoked: false },
      data: { isRevoked: true },
    });

    if (result.count === 0) {
      // Token not found or already revoked — still return success
      // (idempotent logout)
    }

    return { message: 'Logged out' };
  }

  // ── Private Helpers ───────────────────────────────────────────────

  private async generateTokens(
    accountId: string,
    roles: string[],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: accountId, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRY') ||
          '15m') as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRY') ||
          '7d') as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    accountId: string,
    refreshToken: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const familyId = randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        accountId,
        tokenHash,
        expiresAt: this.getRefreshExpiry(),
        familyId,
      },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshExpiry(): Date {
    const expiryStr =
      this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d';
    const match = expiryStr.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
