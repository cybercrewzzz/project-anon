// src/account/dto/register.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  IsDateString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsIn(['male', 'female', 'non_binary', 'prefer_not_to_say'])
  gender?: string = 'prefer_not_to_say';
}