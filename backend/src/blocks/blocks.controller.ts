import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CreateBlockSchema, BlockParamsSchema } from './dto/create-block.dto';
import type { CreateBlockDto, BlockParamsDto } from './dto/create-block.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

// ─────────────────────────────────────────────────────────────────────────────
// BLOCKS CONTROLLER
//
// Exposes endpoints for users and volunteers to manage their personal
// block list. Blocking is bidirectional for matchmaking — if A blocks B,
// neither A nor B can be matched with the other.
//
// Auth: Bearer JWT required. Both 'user' and 'volunteer' roles are permitted.
// ─────────────────────────────────────────────────────────────────────────────

@Controller('block')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  // ─── POST /block ───────────────────────────────────────────────────────
  //
  // Block another user. The blocker's identity comes from the JWT.
  // Returns 201 Created with a success message.

  @Post()
  @Roles('user', 'volunteer')
  @HttpCode(HttpStatus.CREATED)
  async block(
    @CurrentUser('accountId') blockerId: string,
    @Body(new ZodValidationPipe(CreateBlockSchema)) dto: CreateBlockDto,
  ) {
    return this.blocksService.blockUser(blockerId, dto);
  }

  // ─── GET /block ────────────────────────────────────────────────────────
  //
  // List all users blocked by the current user.
  // Returns 200 OK with an array of blocked user IDs and timestamps.

  @Get()
  @Roles('user', 'volunteer')
  async list(@CurrentUser('accountId') blockerId: string) {
    return this.blocksService.listBlocked(blockerId);
  }

  // ─── DELETE /block/:blockedId ──────────────────────────────────────────
  //
  // Unblock a user. The blockedId comes from the URL parameter.
  // Returns 200 OK with a success message.
  //
  // NOTE: The GET route is declared BEFORE this DELETE route to avoid
  // NestJS treating "block" as a :blockedId parameter.

  @Delete(':blockedId')
  @Roles('user', 'volunteer')
  @HttpCode(HttpStatus.OK)
  async unblock(
    @CurrentUser('accountId') blockerId: string,
    @Param(new ZodValidationPipe(BlockParamsSchema)) params: BlockParamsDto,
  ) {
    return this.blocksService.unblockUser(blockerId, params.blockedId);
  }
}
