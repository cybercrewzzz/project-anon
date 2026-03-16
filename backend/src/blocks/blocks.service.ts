import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /block
   * Block another user. Bidirectional exclusion in matching.
   */
  async blockUser(blockerId: string, dto: CreateBlockDto) {
    const { blockedId } = dto;

    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself.');
    }

    // Verify the target account exists
    const targetAccount = await this.prisma.account.findUnique({
      where: { accountId: blockedId },
    });

    if (!targetAccount) {
      throw new NotFoundException('Account not found.');
    }

    // Check if already blocked
    const existingBlock = await this.prisma.blocklist.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    if (existingBlock) {
      throw new ConflictException('User is already blocked.');
    }

    await this.prisma.blocklist.create({
      data: { blockerId, blockedId },
    });

    return { message: 'User blocked' };
  }

  /**
   * DELETE /block/:blockedId
   * Unblock a user.
   */
  async unblockUser(blockerId: string, blockedId: string) {
    const existingBlock = await this.prisma.blocklist.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    if (!existingBlock) {
      throw new NotFoundException('Block not found.');
    }

    await this.prisma.blocklist.delete({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });

    return { message: 'User unblocked' };
  }

  /**
   * GET /block
   * List all users blocked by the current user.
   */
  async getBlockedUsers(blockerId: string) {
    const blocks = await this.prisma.blocklist.findMany({
      where: { blockerId },
      select: {
        blockedId: true,
        blockedAt: true,
      },
      orderBy: { blockedAt: 'desc' },
    });

    return { data: blocks };
  }
}
