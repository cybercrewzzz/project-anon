import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AppVolunteerDTO {
  // account.name — stored on the account row
  @IsString()
  @MaxLength(100)
  name: string;

  // volunteer_profile.institute_email
  @IsEmail()
  @MaxLength(255)
  instituteEmail: string;

  // volunteer_profile.institute_name
  @IsString()
  @MaxLength(100)
  instituteName: string;

  // volunteer_profile.student_id
  @IsString()
  @MaxLength(50)
  studentId: string;

  // volunteer_profile.institute_id_image_url
  @IsString()
  instituteIdImageUrl: string;

  // volunteer_profile.grade
  @IsString()
  @MaxLength(20)
  grade: string;

  // volunteer_profile.about
  @IsOptional()
  @IsString()
  @MaxLength(500)
  about?: string;

  // volunteer_specialisation — must provide at least one area of specialisation
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  specialisationIds: string[];
}
