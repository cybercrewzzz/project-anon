// src/account/dto/register-device-token.dto.ts
// Used by: POST /device/token
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class RegisterDeviceTokenDto {
  // Firebase Cloud Messaging token sent by the mobile app
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  // The platform this device runs on — must match DevicePlatform type
  @IsIn(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';
}
