import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterVolunteerDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(48)
  password!: string;
}
