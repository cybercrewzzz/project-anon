import { apiClient } from './client';
import { parseApiError } from './errors';
import {
  VolunteerApplyResponseSchema,
  type VolunteerApplyResponse,
} from './schemas';

// ── POST /volunteer/apply ─────────────────────────────────────────────────────

export interface ApplyVolunteerBody {
  name: string;
  instituteEmail: string;
  instituteName: string;
  studentId: string;
  instituteIdImageUrl: string;
  grade: string;
  about?: string;
  specialisationIds?: string[];
}

export async function applyAsVolunteer(
  body: ApplyVolunteerBody,
): Promise<VolunteerApplyResponse> {
  try {
    const { data } = await apiClient.post('/volunteer/apply', body);
    return VolunteerApplyResponseSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}
