import { IsString, MinLength, MaxLength, NotContains } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @NotContains(' ')
  newPassword: string;
}
