import { Test, TestingModule } from '@nestjs/testing';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { Platform } from '../generated/prisma/client';

describe('DeviceController', () => {
  let controller: DeviceController;

  const mockDeviceService = {
    registerToken: jest.fn(),
    removeToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceController],
      providers: [{ provide: DeviceService, useValue: mockDeviceService }],
    }).compile();

    controller = module.get<DeviceController>(DeviceController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerToken', () => {
    it('calls deviceService.registerToken with accountId and dto, returns result', async () => {
      const dto = { fcmToken: 'my-fcm-token', platform: Platform.android };
      const expected = { deviceId: 'device-id-1' };
      mockDeviceService.registerToken.mockResolvedValue(expected);

      const result = await controller.registerToken(accountId, dto);

      expect(mockDeviceService.registerToken).toHaveBeenCalledWith(
        accountId,
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('removeToken', () => {
    it('calls deviceService.removeToken with accountId and fcmToken, returns result', async () => {
      const accountId = 'user-id-123';
      const dto = { fcmToken: 'my-fcm-token' };
      const expected = { message: 'Device token removed' };
      mockDeviceService.removeToken.mockResolvedValue(expected);

      const result = await controller.removeToken(accountId, dto);

      expect(mockDeviceService.removeToken).toHaveBeenCalledWith(
        accountId,
        dto.fcmToken,
      );
      expect(result).toEqual(expected);
    });
  });
});
