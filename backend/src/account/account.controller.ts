import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AccountService } from './account.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // ── POST /auth/register ───────────────────────────────────────────────────

  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.accountService.register(dto);
  }

  // ── POST /auth/login ──────────────────────────────────────────────────────

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.accountService.login(dto);
  }

  // ── POST /auth/refresh ────────────────────────────────────────────────────

  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.accountService.refresh(dto);
  }

  // ── POST /auth/logout ─────────────────────────────────────────────────────

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  logout(@Req() req: any, @Body() dto: RefreshTokenDto) {
    return this.accountService.logout(dto, req.user.sub);
  }

  // ── GET /account/me ───────────────────────────────────────────────────────

  @Get('account/me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Req() req: any) {
    return this.accountService.getMe(req.user.sub);
  }

  // ── PATCH /account/me ─────────────────────────────────────────────────────

  @Patch('account/me')
  @UseGuards(AuthGuard('jwt'))
  updateMe(@Req() req: any, @Body() dto: UpdateAccountDto) {
    return this.accountService.updateMe(req.user.sub, dto);
  }

  // ── PATCH /account/me/password ────────────────────────────────────────────

  @Patch('account/me/password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.accountService.changePassword(req.user.sub, dto);
  }

  // ── GET /languages ────────────────────────────────────────────────────────

  @Get('languages')
  @UseGuards(AuthGuard('jwt'))
  getLanguages() {
    return this.accountService.getLanguages();
  }

  // ── POST /device/token ────────────────────────────────────────────────────

  @Post('device/token')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'))
  registerDeviceToken(@Req() req: any, @Body() dto: RegisterDeviceTokenDto) {
    return this.accountService.registerDeviceToken(req.user.sub, dto);
  }

  // ── DELETE /device/token/:deviceId ───────────────────────────────────────

  @Delete('device/token/:deviceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  removeDeviceToken(@Req() req: any, @Param('deviceId') deviceId: string) {
    return this.accountService.removeDeviceToken(req.user.sub, deviceId);
  }
}
