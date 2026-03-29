import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { RemoveDeviceTokenDto } from './dto/remove-device-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('device')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  // POST /device/token
  @Post('token')
  @HttpCode(HttpStatus.CREATED)
  registerToken(
    @CurrentUser('accountId') accountId: string,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.deviceService.registerToken(accountId, dto);
  }

  // DELETE /device/token
  @Delete('token')
  @HttpCode(HttpStatus.OK)
  removeToken(
    @CurrentUser('accountId') accountId: string,
    @Body() dto: RemoveDeviceTokenDto,
  ) {
    return this.deviceService.removeToken(accountId, dto.fcmToken);
  }
}
