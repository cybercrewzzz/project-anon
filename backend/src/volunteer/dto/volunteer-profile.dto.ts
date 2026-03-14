import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SpecialisationDTO {
  // specialisation.specialisation_id
  @IsUUID()
  specialisationId: string;

  // specialisation.name
  @IsString()
  name: string;

  // specialisation.description
  @IsString()
  description: string;
}

class ExperienceDto {
  // volunteer_experience.points
  @IsNumber()
  points: number;

  // volunteer_experience.level
  @IsNumber()
  level: number;

  // volunteer_experience.last_updated
  // @IsDateString() checks the value is a valid
  @IsDateString()
  lastUpdated: string;
}

export class VolunteerProfileDTO {
  // volunteer_profile.account_id
  @IsUUID()
  accountId: string;

  // account.name
  @IsString()
  name: string;

  // volunteer_profile.institute_email
  @IsString()
  instituteEmail: string;

  // volunteer_profile.institute_name
  @IsString()
  instituteName: string;

  // volunteer_profile.student_id
  @IsString()
  studentId: string;

  // volunteer_profile.institute_id_image_url
  @IsString()
  instituteIdImageUrl: string;

  // volunteer_profile.grade
  @IsString()
  grade: string;

  // volunteer_profile.about — nullable in the DB
  @IsOptional()
  @IsString()
  about: string | null;

  // volunteer_profile.verification_status
  @IsEnum(['pending', 'approved', 'rejected'])
  verificationStatus: 'pending' | 'approved' | 'rejected';

  // volunteer_profile.is_available
  @IsBoolean()
  isAvailable: boolean;

  // @ValidateNested({ each: true }) — validate EACH object inside the array
  // @Type(() => SpecialisationDto) — tells class-transformer what class each item is
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialisationDTO)
  specialisations: SpecialisationDTO[];

  // Joined from volunteer_experience table
  @IsOptional()
  @ValidateNested()
  @Type(() => ExperienceDto)
  experience: ExperienceDto | null;
}
