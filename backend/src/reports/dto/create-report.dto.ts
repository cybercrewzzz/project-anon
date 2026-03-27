import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ReportCategory } from '../../generated/prisma/client';

export class CreateReportDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsUUID()
  @IsNotEmpty()
  reportedId: string;

  @IsEnum(ReportCategory)
  @IsNotEmpty()
  category: ReportCategory;

  @IsString()
  @IsOptional()
  description?: string;
}
