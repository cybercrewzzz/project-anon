import { IsEnum, IsOptional } from 'class-validator';
import { VerificationStatus } from '../../generated/prisma/client';
import { PaginationQueryDto } from './pagination-query.dto';

export class FindVolunteerApplicationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(VerificationStatus, {
    message: 'status must be a valid VerificationStatus',
  })
  status?: VerificationStatus;
}
