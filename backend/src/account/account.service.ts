import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

import {
  AccountDataStore,
  Account,
  RefreshToken,
  DeviceToken,
  Language,
  AccountLanguage,
} from './account.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

// ─── Store helpers ────────────────────────────────────────────────────────────

const DATA_PATH = path.join(__dirname, '..', 'mock-account-data.json');

function readStore(): AccountDataStore {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as AccountDataStore;
}

function writeStore(store: AccountDataStore): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

// ─── Crypto helpers ───────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function hashPassword(plain: string): string {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash;
}

// ─── Nickname generator ───────────────────────────────────────────────────────

function generateNickname(existing: (string | null)[]): string {
  const adjectives = ['Blue', 'Silent', 'Green', 'Red', 'Golden', 'Swift', 'Calm', 'Brave'];
  const animals = ['Fox', 'Owl', 'Eagle', 'Wolf', 'Bear', 'Hawk', 'Deer', 'Lion'];
  let nickname: string;
  do {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const num = Math.floor(Math.random() * 90) + 10;
    nickname = `${adj}${animal}${num}`;
  } while (existing.includes(nickname));
  return nickname;
}

// ─── Sanitiser ────────────────────────────────────────────────────────────────

function sanitize(account: Account) {
  const { passwordHash, oauthId, deletedAt, ...safe } = account;
  return safe;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AccountService {
  constructor(private readonly jwtService: JwtService) {}

  // ── POST /auth/register ───────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const store = readStore();

    if (store.accounts.find((a: Account) => a.email.toLowerCase() === dto.email.toLowerCase())) {
      throw new ConflictException('Email is already registered');
    }

    const now = new Date().toISOString();
    const nickname = generateNickname(store.accounts.map((a: Account) => a.nickname));

    const newAccount: Account = {
      accountId: generateId(),
      email: dto.email.toLowerCase(),
      passwordHash: hashPassword(dto.password),
      oauthProvider: null,
      oauthId: null,
      name: null,
      nickname,
      dateOfBirth: dto.dateOfBirth,
      gender: (dto.gender as Account['gender']) ?? 'prefer_not_to_say',
      interfaceLanguageId: 'lang-0001',
      status: 'active',
      roles: ['user'],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    store.accounts.push(newAccount);
    const tokens = await this._issueTokens(newAccount, store);
    writeStore(store);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      account: {
        accountId: newAccount.accountId,
        email: newAccount.email,
        nickname: newAccount.nickname,
        roles: newAccount.roles,
      },
    };
  }

  // ── POST /auth/login ──────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const store = readStore();
    const account = store.accounts.find(
      (a: Account) => a.email.toLowerCase() === dto.email.toLowerCase(),
    );

    if (!account || !verifyPassword(dto.password, account.passwordHash ?? '')) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (account.status === 'banned' || account.status === 'suspended') {
      throw new ForbiddenException(`Account is ${account.status}`);
    }

    const tokens = await this._issueTokens(account, store);
    writeStore(store);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      account: {
        accountId: account.accountId,
        email: account.email,
        nickname: account.nickname,
        name: account.name,
        roles: account.roles,
      },
    };
  }

  // ── POST /auth/refresh ────────────────────────────────────────────────────

  async refresh(dto: RefreshTokenDto) {
    const store = readStore();
    const record = store.refreshTokens.find(
      (t: RefreshToken) => t.tokenHash === hashPassword(dto.refreshToken),
    );

    if (!record || record.isRevoked) {
      if (record) {
        store.refreshTokens
          .filter((t: RefreshToken) => t.familyId === record.familyId)
          .forEach((t: RefreshToken) => { t.isRevoked = true; });
        writeStore(store);
      }
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (new Date(record.expiresAt) < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const account = store.accounts.find((a: Account) => a.accountId === record.accountId);
    if (!account) throw new UnauthorizedException('Account not found');

    record.isRevoked = true;
    const tokens = await this._issueTokens(account, store, record.familyId);
    writeStore(store);

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  // ── POST /auth/logout ─────────────────────────────────────────────────────

  async logout(dto: RefreshTokenDto): Promise<{ message: string }> {
    const store = readStore();
    const record = store.refreshTokens.find(
      (t: RefreshToken) => t.tokenHash === hashPassword(dto.refreshToken),
    );
    if (record) {
      record.isRevoked = true;
      writeStore(store);
    }
    return { message: 'Logged out' };
  }

  // ── GET /account/me ───────────────────────────────────────────────────────

  async getMe(accountId: string) {
    const store = readStore();
    const account = store.accounts.find((a: Account) => a.accountId === accountId);
    if (!account) throw new NotFoundException('Account not found');
    return { ...sanitize(account), languages: this._resolveLanguages(accountId, store) };
  }

  // ── PATCH /account/me ─────────────────────────────────────────────────────

  async updateMe(accountId: string, dto: UpdateAccountDto) {
    const store = readStore();
    const account = store.accounts.find((a: Account) => a.accountId === accountId);
    if (!account) throw new NotFoundException('Account not found');

    if (dto.name !== undefined) account.name = dto.name;
    if (dto.interfaceLanguageId !== undefined) account.interfaceLanguageId = dto.interfaceLanguageId;
    account.updatedAt = new Date().toISOString();

    if (dto.languageIds !== undefined) {
      const validIds = store.languages.map((l: Language) => l.languageId);
      const invalid = dto.languageIds.filter((id: string) => !validIds.includes(id));
      if (invalid.length) {
        throw new BadRequestException(`Unknown languageId(s): ${invalid.join(', ')}`);
      }
      store.accountLanguages = store.accountLanguages.filter(
        (al: AccountLanguage) => al.accountId !== accountId,
      );
      for (const langId of dto.languageIds) {
        store.accountLanguages.push({ accountId, languageId: langId });
      }
    }

    writeStore(store);
    return { ...sanitize(account), languages: this._resolveLanguages(accountId, store) };
  }

  // ── PATCH /account/me/password ────────────────────────────────────────────

  async changePassword(accountId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const store = readStore();
    const account = store.accounts.find((a: Account) => a.accountId === accountId);
    if (!account) throw new NotFoundException('Account not found');

    if (!account.passwordHash) {
      throw new BadRequestException('This account uses social login and has no password to change');
    }

    if (!verifyPassword(dto.currentPassword, account.passwordHash)) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must differ from the current password');
    }

    account.passwordHash = hashPassword(dto.newPassword);
    account.updatedAt = new Date().toISOString();

    store.refreshTokens
      .filter((t: RefreshToken) => t.accountId === accountId && !t.isRevoked)
      .forEach((t: RefreshToken) => { t.isRevoked = true; });

    writeStore(store);
    return { message: 'Password updated successfully' };
  }

  // ── GET /languages ────────────────────────────────────────────────────────

  async getLanguages(): Promise<Language[]> {
    const store = readStore();
    return store.languages;
  }

  // ── POST /device/token ────────────────────────────────────────────────────

  async registerDeviceToken(accountId: string, dto: RegisterDeviceTokenDto): Promise<{ deviceId: string }> {
    const store = readStore();

    const existing = store.deviceTokens.find(
      (d: DeviceToken) => d.accountId === accountId && d.fcmToken === dto.fcmToken,
    );

    if (existing) {
      existing.platform = dto.platform;
      existing.lastActiveAt = new Date().toISOString();
      writeStore(store);
      return { deviceId: existing.deviceId };
    }

    const newToken: DeviceToken = {
      deviceId: generateId(),
      accountId,
      fcmToken: dto.fcmToken,
      platform: dto.platform,
      lastActiveAt: new Date().toISOString(),
    };

    store.deviceTokens.push(newToken);
    writeStore(store);
    return { deviceId: newToken.deviceId };
  }

  // ── DELETE /device/token/:deviceId ────────────────────────────────────────

  async removeDeviceToken(accountId: string, deviceId: string): Promise<{ message: string }> {
    const store = readStore();

    const index = store.deviceTokens.findIndex(
      (d: DeviceToken) => d.deviceId === deviceId && d.accountId === accountId,
    );

    if (index === -1) throw new NotFoundException('Device token not found');

    store.deviceTokens.splice(index, 1);
    writeStore(store);
    return { message: 'Device token removed' };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async _issueTokens(account: Account, store: AccountDataStore, existingFamilyId?: string) {
    const payload = { sub: account.accountId, email: account.email, roles: account.roles };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const rawRefresh = generateId();
    const familyId = existingFamilyId ?? generateId();

    const refreshRecord: RefreshToken = {
      tokenId: generateId(),
      accountId: account.accountId,
      tokenHash: hashPassword(rawRefresh),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isRevoked: false,
      familyId,
    };

    store.refreshTokens.push(refreshRecord);
    return { accessToken, refreshToken: rawRefresh };
  }

  private _resolveLanguages(accountId: string, store: AccountDataStore): Language[] {
    const linkedIds = store.accountLanguages
      .filter((al: AccountLanguage) => al.accountId === accountId)
      .map((al: AccountLanguage) => al.languageId);
    return store.languages.filter((l: Language) => linkedIds.includes(l.languageId));
  }
}