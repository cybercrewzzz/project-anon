import { IsEnum, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Platform } from '../../generated/prisma/client';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fcmToken!: string;

  @IsEnum(Platform)
  platform!: Platform;
}
