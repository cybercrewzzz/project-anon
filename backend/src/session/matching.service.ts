import { Injectable } from '@nestjs/common';
import { AccountStatus, VerificationStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface MatchInput {
  seekerId: string;
  categoryId: string;
  seekerLanguageIds: string[];
}

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findBestVolunteer({
    seekerId,
    categoryId,
    seekerLanguageIds,
  }: MatchInput): Promise<string | null> {
    const pooledVolunteerIds = await this.redis.smembers('volunteer:pool');

    if (pooledVolunteerIds.length === 0) {
      return null;
    }

    const category = await this.prisma.category.findUnique({
      where: { categoryId },
      select: { name: true },
    });

    if (!category) {
      return null;
    }

    const candidates = await this.prisma.volunteerProfile.findMany({
      where: {
        accountId: { in: pooledVolunteerIds },
        isAvailable: true,
        verificationStatus: VerificationStatus.approved,
        account: {
          status: AccountStatus.active,
          blocksInitiated: {
            none: { blockedId: seekerId },
          },
          blocksReceived: {
            none: { blockerId: seekerId },
          },
        },
      },
      select: {
        accountId: true,
        account: {
          select: {
            accountLanguages: {
              select: { languageId: true },
            },
            volunteerSpecialisations: {
              select: {
                specialisation: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    const scored = candidates
      .map((candidate) => {
        const overlapLanguages = candidate.account.accountLanguages.filter(
          (l) => seekerLanguageIds.includes(l.languageId),
        ).length;

        const hasMatchingSpecialisation =
          candidate.account.volunteerSpecialisations.some(
            (entry) =>
              entry.specialisation.name.toLowerCase() ===
              category.name.toLowerCase(),
          );

        return {
          const overlapLanguages = candidate.account.accountLanguages.filter(
            (l) => seekerLanguageIds.includes(l.languageId),
          ).length;

          const hasMatchingSpecialisation =
            candidate.account.volunteerSpecialisations.some(
              (entry) =>
                entry.specialisation.name.toLowerCase() ===
                category.name.toLowerCase(),
            );
        'volunteer:pool',
        candidate.volunteerId,
      );

      if (removedCount === 1) {
        return candidate.volunteerId;
      }
    }

    return null;
  }
}
