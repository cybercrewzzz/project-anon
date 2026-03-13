import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  adminNotes: string;
}
