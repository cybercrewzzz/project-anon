import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SessionStatus } from '../../generated/prisma/client';
import { PaginationQueryDto } from './pagination-query.dto';

export class FindSessionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SessionStatus, { message: 'status must be a valid SessionStatus' })
  status?: SessionStatus;

  @IsOptional()
  @IsUUID()
  seekerId?: string;

  @IsOptional()
  @IsUUID()
  listenerId?: string;
}
