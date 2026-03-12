import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ActionType } from 'src/generated/prisma/client';

export class TakeActionDto {
  @IsEnum(ActionType, { message: 'actionType must be a valid ActionType' })
  @IsNotEmpty()
  actionType: ActionType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'expiresAt must be a valid ISO-8601 date string' },
  )
  expiresAt?: string;
}
