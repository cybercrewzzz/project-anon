import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ReportCategory {
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  ABUSIVE_BEHAVIOR = 'abusive_behavior',
  OTHER = 'other',
}

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