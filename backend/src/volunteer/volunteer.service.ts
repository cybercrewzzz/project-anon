import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDTO } from './dto/update-profile.dto';
import { UpdateStatusDTO } from './dto/update-status.dto';
import { ApplyVolunteerDTO } from './dto/apply-volunteer.dto';
//import { spec } from 'node:test/reporters';

//import mockData from './mock-volunteer-data.json';

// const volunteerProfiles = mockData.volunteerProfiles;
// const pendingApplications = mockData.pendingApplications;
// const masterSpecialisations = mockData.specialisations;

@Injectable()
export class VolunteerService {
  // SHARED HELPER — findProfileOrFail()

  constructor(private readonly prisma: PrismaService) {}

  // GET /volunteer/profile

  async getProfile(accountId: string) {
    // Find the profile — throws 404 automatically if not found
    const profile = await this.prisma.volunteerProfile.findUnique({
      where: { accountId },
      include: {
        account: {
          select: { name: true },
        },
        volunterrSpecialisations: {
          include: { specialisations: true },
        },
        volunteerExperience: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Volunteer profile not found');
    }

    // Format and return using the shared helper
    return {
      accountId: profile.accountId,
      name: profile.account?.name ?? null,
      instituteEmail: profile.instituteEmail,
      instituteName: profile.instituteName,
      studentId: profile.studentId,
      instituteIdImageUrl: profile.instituteIdImageUrl,
      grade: profile.grade,
      about: profile.about,
      verificationStatus: profile.verificationStatus,
      isAvailable: profile.isAvailable,
      specialisations: profile.volunterrSpecialisations.map((vs) => ({
        specialisationId: vs.specialisations.specialisationId,
        name: vs.specialisations.name,
        description: vs.specialisations.description,
      })),
      experience: profile.volunteerExperience
        ? {
            points: profile.volunteerExperience.points,
            level: profile.volunteerExperience.level,
            lastUpdated: profile.volunteerExperience.lastUpdated,
          }
        : null,
    };
  }

  // PATCH /volunteer/profile

  async updateProfile(accountId: string, dto: UpdateProfileDTO) {
    // Find the profile — throws 404 if not found
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

    // ── Update 'specialisations'
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
          status: { in: ['PENDING', 'APPROVED'] },
        },
      });

    if (existingApplication) {
      throw new ConflictException('An active application already exists');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.volunteerProfile.create({
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
      });

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
          submittedAt: new Date(),
        },
      });

      await tx.volunteerExperience.create({
        data: {
          accountId,
          points: 0,
          level: 0,
        },
      });

      await tx.account.update({
        where: { accountId },
        data: { name: dto.name },
      });
    });

    return {
      message: 'Application submitted',
      verificationStatus: 'pending',
    };
  }
}
