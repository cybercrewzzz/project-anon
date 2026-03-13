import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { UpdateStatusDTO } from './dto/update-status.dto';
import { ApplyVolunteerDTO } from './dto/apply-volunteer.dto';

@Injectable()
export class VolunteerService {
  constructor(private readonly prisma: PrismaService) {}

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
    const existing = await this.prisma.volunteerProfile.findUnique({
      where: { accountId },
    });

    if (!existing) {
      throw new NotFoundException('Volunteer profile not found');
    }

    await this.prisma.volunteerProfile.update({
      where: { accountId },
      data: {
        ...(dto.about !== undefined && { about: dto.about }),
      },
    });

    // ── Update specialisations
    if (dto.specialisationIds !== undefined) {
      await this.prisma.$transaction([
        this.prisma.volunteerSpecialisation.deleteMany({
          where: { accountId },
        }),
        this.prisma.volunteerSpecialisation.createMany({
          data: dto.specialisationIds.map((specialisationId) => ({
            accountId,
            specialisationId,
          })),
        }),
      ]);
    }

    return this.getProfile(accountId);
  }

  // PATCH /volunteer/status

  async updateStatus(accountId: string, dto: UpdateStatusDTO) {
    const existing = await this.prisma.volunteerProfile.findUnique({
      where: { accountId },
    });

    if (!existing) {
      throw new NotFoundException('Volunteer profile not found');
    }

    const updated = await this.prisma.volunteerProfile.update({
      where: { accountId },
      data: { isAvailable: dto.available },
    });

    return { isAvailable: updated.isAvailable };
  }

  // POST /volunteer/apply

  async applyAsVolunteer(accountId: string, dto: ApplyVolunteerDTO) {
    const existingApplication =
      await this.prisma.volunteerVerification.findFirst({
        where: {
          volunteerId: accountId,
          status: { in: ['pending', 'approved'] },
        },
      });

    if (existingApplication) {
      throw new ConflictException('An active application already exists');
    }

    await this.prisma.$transaction([
      this.prisma.volunteerProfile.create({
        data: {
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
      }),
      this.prisma.volunteerSpecialisation.createMany({
        data: dto.specialisationIds.map((specialisationId) => ({
          accountId,
          specialisationId,
        })),
      }),
      this.prisma.volunteerVerification.create({
        data: {
          volunteerId: accountId,
          documentUrl: dto.instituteIdImageUrl,
          status: 'pending',
          submittedAt: new Date(),
        },
      }),
      this.prisma.volunteerExperience.create({
        data: {
          accountId,
          points: 0,
          level: 0,
        },
      }),
      this.prisma.account.update({
        where: { accountId },
        data: { name: dto.name },
      }),
    ]);

    return {
      message: 'Application submitted',
      verificationStatus: 'pending',
    };
  }
}
