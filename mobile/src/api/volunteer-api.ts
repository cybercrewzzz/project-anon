import { apiClient } from './client';
import { parseApiError, ApiError } from './errors';
import {
  VolunteerApplyResponseSchema,
  VolunteerProfileSchema,
  type VolunteerApplyResponse,
  type VolunteerProfile,
} from './schemas';
import { ZodError } from 'zod';

// ── GET /volunteer/profile ───────────────────────────────────────────────────

export async function fetchVolunteerProfile(): Promise<VolunteerProfile> {
  try {
    const { data } = await apiClient.get('/volunteer/profile');
    return VolunteerProfileSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // The server responded, but the payload did not match the expected schema.
      throw new ApiError(500, 'Invalid response from server');
    }
    throw parseApiError(error);
  }
}

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
