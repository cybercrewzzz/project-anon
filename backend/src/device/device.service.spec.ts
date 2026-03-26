import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeviceService } from './device.service';
import { Platform } from '../generated/prisma/client';

const createMockPrisma = () => ({
  deviceToken: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

describe('DeviceService', () => {
  let service: DeviceService;
  let db: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    db = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceService, { provide: PrismaService, useValue: db }],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── registerToken ─────────────────────────────────────────────────

  describe('registerToken', () => {
    const dto = { fcmToken: 'token-abc', platform: Platform.android };

    it('creates a new device token when none exists and returns deviceId', async () => {
      db.deviceToken.findFirst.mockResolvedValue(null);
      db.deviceToken.create.mockResolvedValue({
        deviceId: 'device-id-1',
        accountId,
        fcmToken: dto.fcmToken,
        platform: 'android',
        lastActiveAt: new Date(),
      });

      const result = await service.registerToken(accountId, dto);

      expect(db.deviceToken.findFirst).toHaveBeenCalledWith({
        where: { accountId, fcmToken: dto.fcmToken },
      });
      expect(db.deviceToken.create).toHaveBeenCalledWith({
        data: {
          accountId,
          fcmToken: dto.fcmToken,
          platform: dto.platform,
        },
      });
      expect(result).toEqual({ deviceId: 'device-id-1' });
    });

    it('updates lastActiveAt when token already exists and returns existing deviceId', async () => {
      const existing = {
        deviceId: 'device-id-existing',
        accountId,
        fcmToken: dto.fcmToken,
        platform: 'android',
        lastActiveAt: new Date('2026-01-01'),
      };
      db.deviceToken.findFirst.mockResolvedValue(existing);
      db.deviceToken.update.mockResolvedValue(existing);

      const result = await service.registerToken(accountId, dto);

      expect(db.deviceToken.create).not.toHaveBeenCalled();
      expect(db.deviceToken.update).toHaveBeenCalledWith({
        where: { deviceId: 'device-id-existing' },
        data: { lastActiveAt: expect.any(Date) },
      });
      expect(result).toEqual({ deviceId: 'device-id-existing' });
    });
  });

  // ── removeToken ───────────────────────────────────────────────────

  describe('removeToken', () => {
    const accountId = 'account-id';
    const fcmToken = 'token-to-remove';

    it('deletes the device token and returns success message', async () => {
      const existing = {
        deviceId: 'device-id-1',
        accountId,
        fcmToken,
        platform: 'ios',
        lastActiveAt: new Date(),
      };
      db.deviceToken.findFirst.mockResolvedValue(existing);
      db.deviceToken.delete.mockResolvedValue(existing);

      const result = await service.removeToken(accountId, fcmToken);

      expect(db.deviceToken.findFirst).toHaveBeenCalledWith({
        where: { accountId, fcmToken },
      });
      expect(db.deviceToken.delete).toHaveBeenCalledWith({
        where: { deviceId: 'device-id-1' },
      });
      expect(result).toEqual({ message: 'Device token removed' });
    });

    it('throws NotFoundException when device token not found', async () => {
      db.deviceToken.findFirst.mockResolvedValue(null);

      await expect(service.removeToken(accountId, fcmToken)).rejects.toThrow(
        NotFoundException,
      );
      expect(db.deviceToken.delete).not.toHaveBeenCalled();
    });
  });
});
