import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AccountService } from './account.service';
import { PrismaService } from '../prisma/prisma.service';

// Separate tx mock for $transaction isolation
const createMockTx = () => ({
  account: {
    update: jest.fn(),
  },
  accountLanguage: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
});

const createMockPrisma = () => ({
  account: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  accountLanguage: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
});

const mockAccount = {
  accountId: 'account-id',
  email: 'test@example.com',
  name: null,
  nickname: 'BlueFox42',
  ageRange: 'range_21_26',
  gender: 'prefer_not_to_say',
  status: 'active',
  createdAt: new Date('2026-01-01'),
  interfaceLanguage: { languageId: 'lang-1', code: 'en', name: 'English' },
  accountLanguages: [
    { language: { languageId: 'lang-1', code: 'en', name: 'English' } },
  ],
  accountRoles: [{ role: { name: 'user' } }],
};

describe('AccountService', () => {
  let service: AccountService;
  let db: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    db = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountService, { provide: PrismaService, useValue: db }],
    }).compile();

    service = module.get<AccountService>(AccountService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getMe ────────────────────────────────────────────────────────

  describe('getMe', () => {
    const accountId = 'account-id';

    it('returns the full account info', async () => {
      db.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.getMe(accountId);

      expect(db.account.findUnique).toHaveBeenCalledWith({
        where: { accountId },
        select: expect.objectContaining({
          accountId: true,
          email: true,
          interfaceLanguage: expect.any(Object),
          accountLanguages: expect.any(Object),
          accountRoles: expect.any(Object),
        }),
      });

      expect(result).toMatchObject({
        accountId: mockAccount.accountId,
        email: mockAccount.email,
        nickname: mockAccount.nickname,
        roles: ['user'],
        languages: [{ languageId: 'lang-1', code: 'en', name: 'English' }],
        interfaceLanguage: {
          languageId: 'lang-1',
          code: 'en',
          name: 'English',
        },
      });
    });

    it('throws NotFoundException when account not found', async () => {
      db.account.findUnique.mockResolvedValue(null);

      await expect(service.getMe(accountId)).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateMe ─────────────────────────────────────────────────────

  describe('updateMe', () => {
    const accountId = 'account-id';

    beforeEach(() => {
      // assertAccountActive resolves active
      db.account.findUnique
        .mockResolvedValueOnce({ status: 'active' }) // assertAccountActive
        .mockResolvedValueOnce(mockAccount) // existing check
        .mockResolvedValue(mockAccount); // getMe call at end
    });

    it('updates only scalar fields (no languageIds)', async () => {
      await service.updateMe(accountId, { name: 'New Name' });

      expect(db.account.update).toHaveBeenCalledWith({
        where: { accountId },
        data: { name: 'New Name' },
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('replaces spoken languages inside a transaction', async () => {
      const tx = createMockTx();
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      await service.updateMe(accountId, {
        languageIds: ['lang-1', 'lang-2'],
      });

      expect(db.$transaction).toHaveBeenCalled();
      expect(tx.accountLanguage.deleteMany).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(tx.accountLanguage.createMany).toHaveBeenCalledWith({
        data: [
          { accountId, languageId: 'lang-1' },
          { accountId, languageId: 'lang-2' },
        ],
      });
    });

    it('updates scalar fields and replaces languages in transaction', async () => {
      const tx = createMockTx();
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      await service.updateMe(accountId, {
        interfaceLanguageId: 'lang-2',
        languageIds: ['lang-2'],
      });

      expect(tx.account.update).toHaveBeenCalledWith({
        where: { accountId },
        data: { interfaceLanguageId: 'lang-2' },
      });
    });

    it('clears all languages when languageIds is empty array', async () => {
      const tx = createMockTx();
      db.$transaction.mockImplementation(
        (fn: (tx: ReturnType<typeof createMockTx>) => unknown) => fn(tx),
      );

      await service.updateMe(accountId, { languageIds: [] });

      expect(tx.accountLanguage.deleteMany).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(tx.accountLanguage.createMany).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when account not found', async () => {
      db.account.findUnique.mockReset();
      db.account.findUnique
        .mockResolvedValueOnce({ status: 'active' })
        .mockResolvedValueOnce(null);

      await expect(
        service.updateMe(accountId, { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for suspended account', async () => {
      db.account.findUnique.mockReset();
      db.account.findUnique.mockResolvedValueOnce({ status: 'suspended' });

      await expect(
        service.updateMe(accountId, { name: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for banned account', async () => {
      db.account.findUnique.mockReset();
      db.account.findUnique.mockResolvedValueOnce({ status: 'banned' });

      await expect(
        service.updateMe(accountId, { name: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── changePassword ────────────────────────────────────────────────

  describe('changePassword', () => {
    const accountId = 'account-id';

    it('changes password when current password is correct', async () => {
      const hash = await argon2.hash('currentPass123', {
        type: argon2.argon2id,
      });
      db.account.findUnique.mockResolvedValue({
        passwordHash: hash,
        status: 'active',
      });
      db.account.update.mockResolvedValue({});

      const result = await service.changePassword(accountId, {
        currentPassword: 'currentPass123',
        newPassword: 'newPassword456',
      });

      expect(db.account.update).toHaveBeenCalledWith({
        where: { accountId },
        data: { passwordHash: expect.any(String) },
      });
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('throws UnauthorizedException when current password is wrong', async () => {
      const hash = await argon2.hash('correctPass', { type: argon2.argon2id });
      db.account.findUnique.mockResolvedValue({
        passwordHash: hash,
        status: 'active',
      });

      await expect(
        service.changePassword(accountId, {
          currentPassword: 'wrongPass',
          newPassword: 'newPassword456',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(db.account.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when account not found', async () => {
      db.account.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(accountId, {
          currentPassword: 'any',
          newPassword: 'newPassword456',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for OAuth accounts without a password', async () => {
      db.account.findUnique.mockResolvedValue({
        passwordHash: null,
        status: 'active',
      });

      await expect(
        service.changePassword(accountId, {
          currentPassword: 'any',
          newPassword: 'newPassword456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException for suspended account', async () => {
      db.account.findUnique.mockResolvedValue({
        passwordHash: 'hash',
        status: 'suspended',
      });

      await expect(
        service.changePassword(accountId, {
          currentPassword: 'any',
          newPassword: 'newPassword456',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for banned account', async () => {
      db.account.findUnique.mockResolvedValue({
        passwordHash: 'hash',
        status: 'banned',
      });

      await expect(
        service.changePassword(accountId, {
          currentPassword: 'any',
          newPassword: 'newPassword456',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
