import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RemoveDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fcmToken!: string;
}
