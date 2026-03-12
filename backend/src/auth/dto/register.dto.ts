import {
  IsEmail,
  IsString,
  MinLength,
  IsDateString,
  IsOptional,
  IsEnum,
} from 'class-validator';

export enum GenderEnum {
  male = 'male',
  female = 'female',
  other = 'other',
  prefer_not_to_say = 'prefer_not_to_say',
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;
}
