import { IsUUID, IsString } from 'class-validator';

export class SpecialisationDTO {
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
