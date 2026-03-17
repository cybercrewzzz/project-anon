import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { RegisterVolunteerDto } from './dto/register-volunteer.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { generateUniqueNickname } from '../common/utils/nickname-generator.js';
import { AgeRange } from '../generated/prisma/client.js';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Register ──────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // Check if email is taken (including by admin accounts)
    const existingAccount = await this.prisma.account.findUnique({
      where: { email: dto.email },
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
          email: dto.email,
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
    // Check if email is taken
    const existingAccount = await this.prisma.account.findUnique({
      where: { email: dto.email },
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
          email: dto.email,
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
    // Find account by email
    const account = await this.prisma.account.findUnique({
      where: { email: dto.email },
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
    const passwordValid = await argon2.verify(
      account.passwordHash,
      dto.password,
    );
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
}
