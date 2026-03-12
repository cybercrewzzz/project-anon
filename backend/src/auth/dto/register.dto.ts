import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export enum AgeRangeEnum {
  RANGE_16_20 = 'range_16_20',
  RANGE_21_26 = 'range_21_26',
  RANGE_27_PLUS = 'range_27_plus',
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(AgeRangeEnum)
  ageRange!: AgeRangeEnum;
}
