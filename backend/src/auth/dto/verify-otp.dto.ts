import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;
}
