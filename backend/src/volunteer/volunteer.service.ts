import { Injectable, NotFoundException } from '@nestjs/common';
import mockData from './mock-volunteer-data.json';

@Injectable()
export class VolunteerService {
  async getProfile(accountId: string) {
    const profile = mockData.volunteerProfiles.find(
      (p) => p.accountId === accountId,
    );

    if (!profile) {
      throw new NotFoundException('Volunteer profile not found');
    }
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
}
