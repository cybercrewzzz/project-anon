import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBlockDto } from './dto/create-block.dto';

// ─────────────────────────────────────────────────────────────────────────────
// BLOCKS SERVICE
//
// Handles the business logic for user-to-user blocking. When a user blocks
// someone, the matching algorithm enforces BIDIRECTIONAL exclusion — neither
// party can be matched with the other, regardless of who initiated the block.
//
// Key rules from the README:
//   1. A user cannot block themselves.
//   2. Blocking is idempotent-ish: re-blocking returns 409 Conflict.
//   3. Unblocking removes the block row. If no block exists, returns 404.
//   4. Both users and volunteers can block/unblock.
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class BlocksService {
  private readonly logger = new Logger(BlocksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Block another user.
   *
   * @param blockerId - The account ID of the person initiating the block (from JWT).
   * @param dto       - Validated request body containing the blockedId.
   * @returns         - Success message.
   */
  async blockUser(blockerId: string, dto: CreateBlockDto) {
    const { blockedId } = dto;

    // ── Guard: Cannot block yourself ───────────────────────────────────
    if (blockerId === blockedId) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'cannot_block_self',
        message: "You cannot block yourself.",
      });
    }

    // ── Verify the target account exists ───────────────────────────────
    const targetAccount = await this.prisma.account.findUnique({
      where: { accountId: blockedId },
      select: { accountId: true },
    });

    if (!targetAccount) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'account_not_found',
        message: 'The user you are trying to block does not exist.',
      });
    }

    // ── Create the block ───────────────────────────────────────────────
    // Using try/catch to handle Prisma P2002 unique constraint violations,
    // which prevents race conditions during concurrent requests.
    try {
      await this.prisma.blocklist.create({
        data: {
          blockerId,
          blockedId,
        },
      });
    } catch (error) {
      if ((error as any)?.code === 'P2002') {
        throw new ConflictException({
          statusCode: 409,
          error: 'already_blocked',
          message: 'You have already blocked this user.',
        });
      }
      throw error;
    }

    this.logger.log(`User ${blockerId} blocked user ${blockedId}`);

    return { message: 'User blocked' };
  }

  /**
   * Unblock a user.
   *
   * @param blockerId - The account ID of the person removing the block (from JWT).
   * @param blockedId - The account ID of the user being unblocked (from URL param).
   * @returns         - Success message.
   */
  async unblockUser(blockerId: string, blockedId: string) {
    // ── Try to delete the block row ────────────────────────────────────
    // Using deleteMany instead of delete to avoid throwing on non-existent
    // rows — we handle the "not found" case manually.
    const result = await this.prisma.blocklist.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'block_not_found',
        message: 'You have not blocked this user.',
      });
    }

    this.logger.log(`User ${blockerId} unblocked user ${blockedId}`);

    return { message: 'User unblocked' };
  }

  /**
   * List all users blocked by the current user.
   *
   * @param blockerId - The account ID of the person requesting the list (from JWT).
   * @returns         - Array of blocked user IDs and timestamps.
   */
  async listBlocked(blockerId: string) {
    const blocks = await this.prisma.blocklist.findMany({
      where: { blockerId },
      select: {
        blockedId: true,
        blockedAt: true,
      },
      orderBy: { blockedAt: 'desc' },
    });

    return {
      data: blocks.map((block) => ({
        blockedId: block.blockedId,
        blockedAt: block.blockedAt.toISOString(),
      })),
    };
  }
}
