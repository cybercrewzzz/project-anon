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
  // private findProfileOrFail(accountId: string) {
  //   const profile = volunteerProfiles.find((p) => p.accountId === accountId);

  //   if (!profile) {
  //     throw new NotFoundException('Volunteer profile not found');
  //   }
  //   return profile;
  // }

  // // SHARED HELPER — formatProfile()
  // private formatProfile(profile: (typeof volunteerProfiles)[0]) {
  //   return {
  //     accountId: profile.accountId,
  //     name: profile.name,
  //     instituteEmail: profile.instituteEmail,
  //     instituteName: profile.instituteName,
  //     studentId: profile.studentId,
  //     instituteIdImageUrl: profile.instituteIdImageUrl,
  //     grade: profile.grade,
  //     about: profile.about,
  //     verificationStatus: profile.verificationStatus,
  //     isAvailable: profile.isAvailable,
  //     specialisations: profile.specialisations.map((s) => ({
  //       specialisationId: s.specialisationId,
  //       name: s.name,
  //       description: s.description,
  //     })),
  //     experience: {
  //       points: profile.experience.points,
  //       level: profile.experience.level,
  //       lastUpdated: profile.experience.lastUpdated,
  //     },
  //   };
  // }

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

  updateProfile(accountId: string, dto: UpdateProfileDTO) {
    // Find the profile — throws 404 if not found
    const profile = this.findProfileOrFail(accountId);

    // ── Update 'about'
    if (dto.about !== undefined) {
      profile.about = dto.about;
    }

    if (dto.specialisationIds !== undefined) {
      profile.specialisations = dto.specialisationIds
        .map((id) =>
          masterSpecialisations.find((s) => s.specialisationId === id),
        )
        .filter(Boolean) as typeof profile.specialisations;
    }
    return this.formatProfile(profile);
  }

  // PATCH /volunteer/status

  updateStatus(accountId: string, dto: UpdateStatusDTO) {
    const profile = this.findProfileOrFail(accountId);
    profile.isAvailable = dto.available;
    return {
      isAvailable: profile.isAvailable,
    };
  }

  // POST /volunteer/apply

  applyAsVolunteer(accountId: string, dto: ApplyVolunteerDTO) {
    const alreadyAVolunteer = volunteerProfiles.find(
      (p) => p.accountId === accountId,
    );

    const alreadyApplied = pendingApplications.find(
      (a) => a.accountId === accountId,
    );

    // ConflictException automatically sends a 409 response.
    if (alreadyAVolunteer || alreadyApplied) {
      throw new ConflictException('already_applied');
    }

    // ── Look up full specialisation objects

    const resolvedSpecialisations = dto.specialisationIds.map((id) => {
      const found = masterSpecialisations.find(
        (s) => s.specialisationId === id,
      );

      if (!found) {
        throw new NotFoundException(`Specialisation with id ${id} not found`);
      }
      return found;
    });

    // ── Generate a mock requestId
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const submittedAt = new Date().toISOString();

    // ── Simulate the 4-table transaction
    pendingApplications.push({
      requestId,
      accountId,
      status: 'pending',
      submittedAt,
    });

    volunteerProfiles.push({
      accountId,
      name: dto.name,
      instituteEmail: dto.instituteEmail,
      instituteName: dto.instituteName,
      studentId: dto.studentId,
      instituteIdImageUrl: dto.instituteIdImageUrl,
      grade: dto.grade,
      about: dto.about ?? null,
      verificationStatus: 'pending',
      isAvailable: false,
      specialisations: resolvedSpecialisations,
      experience: {
        points: 0,
        level: 0,
        lastUpdated: submittedAt,
      },
    });

    // ── Return response
    return {
      message: 'Application submitted',
      verificationStatus: 'pending',
    };
  }
}
