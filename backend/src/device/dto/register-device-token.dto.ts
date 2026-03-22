import { IsEnum, IsString } from 'class-validator';

export enum PlatformEnum {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export class RegisterDeviceTokenDto {
  @IsString()
  fcmToken!: string;

  @IsEnum(PlatformEnum)
  platform!: PlatformEnum;
}
