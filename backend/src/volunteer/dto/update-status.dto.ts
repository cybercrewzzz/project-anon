import { IsBoolean } from 'class-validator';

// ─── PATCH /volunteer/status

export class UpdateStatusDTO {
  // volunteer_profile.is_available
  // true  = volunteer is open to receiving sessions
  // false = volunteer is offline / not accepting sessions
  @IsBoolean()
  available: boolean;
}
