import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { RolesGuard } from '../accounts/guards/roles.guard';
import { Roles } from '../accounts/decorators/roles.decorator';
import { CurrentUser } from '../accounts/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user', 'volunteer')
@Controller('block')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * POST /block
   * Block another user.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async blockUser(
    @CurrentUser('accountId') accountId: string,
    @Body() dto: CreateBlockDto,
  ) {
    return this.blocksService.blockUser(accountId, dto);
  }

  /**
   * DELETE /block/:blockedId
   * Unblock a user.
   */
  @Delete(':blockedId')
  @HttpCode(HttpStatus.OK)
  async unblockUser(
    @CurrentUser('accountId') accountId: string,
    @Param('blockedId', ParseUUIDPipe) blockedId: string,
  ) {
    return this.blocksService.unblockUser(accountId, blockedId);
  }

  /**
   * GET /block
   * List all users blocked by current user.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getBlockedUsers(@CurrentUser('accountId') accountId: string) {
    return this.blocksService.getBlockedUsers(accountId);
  }
}
