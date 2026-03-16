import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AccountStatus } from '../../generated/prisma/client';
import { PaginationQueryDto } from './pagination-query.dto';

export class FindAccountsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsEnum(AccountStatus, { message: 'status must be a valid AccountStatus' })
  status?: AccountStatus;
}
