import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDTO } from './dto/update-profile.dto';

import mockData from './mock-volunteer-data.json';
import { UpdateStatusDTO } from './dto/update-status.dto';

const volunteerProfiles = mockData.volunteerProfiles;

@Injectable()
export class VolunteerService {
  // SHARED HELPER — findProfileOrFail()
  private findProfileOrFail(accountId: string) {
    const profile = volunteerProfiles.find((p) => p.accountId === accountId);

    if (!profile) {
      throw new NotFoundException('Volunteer profile not found');
    }
    return profile;
  }

  // SHARED HELPER — formatProfile()
  private formatProfile(profile: (typeof volunteerProfiles)[0]) {
    return {
      accountId: profile.accountId,
      name: profile.name,
      instituteEmail: profile.instituteEmail,
      instituteName: profile.instituteName,
      studentId: profile.studentId,
      instituteIdImageUrl: profile.instituteIdImageUrl,
      grade: profile.grade,
      about: profile.about,
      verificationStatus: profile.verificationStatus,
      isAvailable: profile.isAvailable,
      specialisations: profile.specialisations.map((s) => ({
        specialisationId: s.specialisationId,
        name: s.name,
        description: s.description,
      })),
      experience: {
        points: profile.experience.points,
        level: profile.experience.level,
        lastUpdated: profile.experience.lastUpdated,
      },
    };
  }

  // GET /volunteer/profile

  async getProfile(accountId: string) {
    // Find the profile — throws 404 automatically if not found
    const profile = this.findProfileOrFail(accountId);

    // Format and return using the shared helper
    return this.formatProfile(profile);
  }

  // PATCH /volunteer/profile

  async updateProfile(accountId: string, dto: UpdateProfileDTO) {
    // Find the profile — throws 404 if not found
    const profile = this.findProfileOrFail(accountId);

    // ── Update 'about'
    if (dto.about !== undefined) {
      profile.about = dto.about;
    }

    if (dto.specialisationIds !== undefined) {
      const allSpecialisation = volunteerProfiles.flatMap(
        (p) => p.specialisations,
      );

      profile.specialisations = dto.specialisationIds
        .map((id) => allSpecialisation.find((s) => s.specialisationId === id))
        .filter(Boolean) as typeof profile.specialisations;
    }
    return this.formatProfile(profile);
  }

  // PATCH /volunteer/status

  async updateStatus(accountId: string, dto: UpdateStatusDTO) {
    const profile = this.findProfileOrFail(accountId);
    profile.isAvailable = dto.available;
    return {
      isAvailable: profile.isAvailable,
    };
  }
}
