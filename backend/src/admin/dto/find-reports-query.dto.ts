import { IsEnum, IsOptional } from 'class-validator';
import { ReportStatus } from '../../generated/prisma/client';
import { PaginationQueryDto } from './pagination-query.dto';

export class FindReportsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ReportStatus, { message: 'status must be a valid ReportStatus' })
  status?: ReportStatus;
}
