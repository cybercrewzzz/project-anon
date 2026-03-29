import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('account')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // GET /account/me
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getMe(@CurrentUser('accountId') accountId: string) {
    return this.accountService.getMe(accountId);
  }

  // PATCH /account/me
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  updateMe(
    @CurrentUser('accountId') accountId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.updateMe(accountId, dto);
  }

  // PATCH /account/me/password
  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser('accountId') accountId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.accountService.changePassword(accountId, dto);
  }

  // GET /account/me/points
  @Get('me/points')
  @HttpCode(HttpStatus.OK)
  getMyPoints(@CurrentUser('accountId') accountId: string) {
    return this.accountService.getMyPoints(accountId);
  }
}
