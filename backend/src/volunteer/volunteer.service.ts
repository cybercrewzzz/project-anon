import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { UpdateStatusDTO } from './dto/update-status.dto';
import { ApplyVolunteerDTO } from './dto/apply-volunteer.dto';

@Injectable()
export class VolunteerService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccountActive(accountId: string): Promise<void> {
    const account = await this.prisma.account.findUnique({
      where: { accountId },
      select: { status: true },
    });
    if (account?.status === 'suspended') {
      throw new ForbiddenException('Account is suspended');
    }
    if (account?.status === 'banned') {
      throw new ForbiddenException('Account has been banned');
    }
  }

  // GET /volunteer/profile

  async getProfile(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { accountId },
      select: {
        name: true,
        volunteerProfile: true,
        volunteerSpecialisations: {
          include: { specialisation: true },
        },
        volunteerExperience: true,
      },
    });

    if (!account?.volunteerProfile) {
      throw new NotFoundException('Volunteer profile not found');
    }

    const profile = account.volunteerProfile;

    return {
      accountId: profile.accountId,
      name: account.name,
      instituteEmail: profile.instituteEmail,
      instituteName: profile.instituteName,
      studentId: profile.studentId,
      instituteIdImageUrl: profile.instituteIdImageUrl,
      grade: profile.grade,
      about: profile.about,
      verificationStatus: profile.verificationStatus,
      isAvailable: profile.isAvailable,
      specialisations: account.volunteerSpecialisations.map((vs) => ({
        specialisationId: vs.specialisation.specialisationId,
        name: vs.specialisation.name,
        description: vs.specialisation.description,
      })),
      experience: account.volunteerExperience
        ? {
            points: account.volunteerExperience.points,
            level: account.volunteerExperience.level,
            lastUpdated: account.volunteerExperience.lastUpdated,
          }
        : null,
    };
  }

  // PATCH /volunteer/profile

  async updateProfile(accountId: string, dto: UpdateProfileDTO) {
    await this.assertAccountActive(accountId);

    const existing = await this.prisma.volunteerProfile.findUnique({
      where: { accountId },
    });

    if (!existing) {
      throw new NotFoundException('Volunteer profile not found');
    }

    if (dto.specialisationIds !== undefined) {
      const { specialisationIds } = dto;
      try {
        await this.prisma.$transaction(async (tx) => {
          if (dto.about !== undefined) {
            await tx.volunteerProfile.update({
              where: { accountId },
              data: { about: dto.about },
            });
          }
          await tx.volunteerSpecialisation.deleteMany({
            where: { accountId },
          });
          await tx.volunteerSpecialisation.createMany({
            data: specialisationIds.map((specialisationId) => ({
              accountId,
              specialisationId,
            })),
          });
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2003'
        ) {
          throw new BadRequestException(
            'One or more specialisation IDs are invalid',
          );
        }
        throw e;
      }
    } else if (dto.about !== undefined) {
      await this.prisma.volunteerProfile.update({
        where: { accountId },
        data: { about: dto.about },
      });
    }

    return this.getProfile(accountId);
  }

  // PATCH /volunteer/status

  async updateStatus(accountId: string, dto: UpdateStatusDTO) {
    await this.assertAccountActive(accountId);

    const existing = await this.prisma.volunteerProfile.findUnique({
      where: { accountId },
    });

    if (!existing) {
      throw new NotFoundException('Volunteer profile not found');
    }

    if (existing.verificationStatus !== 'approved') {
      throw new ForbiddenException(
        'Only approved volunteers can change availability',
      );
    }

    const updated = await this.prisma.volunteerProfile.update({
      where: { accountId },
      data: { isAvailable: dto.available },
    });

    return { isAvailable: updated.isAvailable };
  }

  // POST /volunteer/apply

  async applyAsVolunteer(accountId: string, dto: ApplyVolunteerDTO) {
    await this.assertAccountActive(accountId);

    try {
      await this.prisma.$transaction(async (tx) => {
        const existingApplication = await tx.volunteerVerification.findFirst({
          where: {
            volunteerId: accountId,
            status: { in: ['pending', 'approved'] },
          },
        });

        if (existingApplication) {
          throw new ConflictException('An active application already exists');
        }

        await tx.volunteerProfile.upsert({
          where: { accountId },
          update: {
            instituteEmail: dto.instituteEmail,
            instituteName: dto.instituteName,
            studentId: dto.studentId,
            instituteIdImageUrl: dto.instituteIdImageUrl,
            grade: dto.grade,
            about: dto.about ?? null,
            verificationStatus: 'pending',
            isAvailable: false,
          },
          create: {
            accountId,
            instituteEmail: dto.instituteEmail,
            instituteName: dto.instituteName,
            studentId: dto.studentId,
            instituteIdImageUrl: dto.instituteIdImageUrl,
            grade: dto.grade,
            about: dto.about ?? null,
            verificationStatus: 'pending',
            isAvailable: false,
          },
        });
        await tx.volunteerSpecialisation.deleteMany({ where: { accountId } });
        await tx.volunteerSpecialisation.createMany({
          data: dto.specialisationIds.map((specialisationId) => ({
            accountId,
            specialisationId,
          })),
        });
        await tx.volunteerVerification.create({
          data: {
            volunteerId: accountId,
            documentUrl: dto.instituteIdImageUrl,
            status: 'pending',
          },
        });
        await tx.volunteerExperience.upsert({
          where: { accountId },
          update: {},
          create: { accountId, points: 0 },
        });
        await tx.account.update({
          where: { accountId },
          data: { name: dto.name },
        });
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException(
          'One or more specialisation IDs are invalid',
        );
      }
      throw e;
    }

    return {
      message: 'Application submitted',
      verificationStatus: 'pending',
    };
  }
}
