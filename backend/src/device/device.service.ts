import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { Platform } from '../generated/prisma/client';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  // POST /device/token
  async registerToken(accountId: string, dto: RegisterDeviceTokenDto) {
    // Upsert: if a token with the same fcmToken already exists for this account,
    // just update last_active_at. Otherwise create a new row.
    const existing = await this.prisma.deviceToken.findFirst({
      where: { accountId, fcmToken: dto.fcmToken },
    });

    if (existing) {
      await this.prisma.deviceToken.update({
        where: { deviceId: existing.deviceId },
        data: { lastActiveAt: new Date() },
      });
      return { deviceId: existing.deviceId };
    }

    const created = await this.prisma.deviceToken.create({
      data: {
        accountId,
        fcmToken: dto.fcmToken,
        platform: dto.platform as Platform,
      },
    });

    return { deviceId: created.deviceId };
  }

  // DELETE /device/token
  async removeToken(accountId: string, fcmToken: string) {
    const existing = await this.prisma.deviceToken.findFirst({
      where: { accountId, fcmToken },
    });

    if (!existing) {
      throw new NotFoundException('Device token not found');
    }

    await this.prisma.deviceToken.delete({
      where: { deviceId: existing.deviceId },
    });

    return { message: 'Device token removed' };
  }
}
