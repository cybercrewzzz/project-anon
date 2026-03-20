import { apiClient } from './client';
import { parseApiError, ApiError} from './errors';
import {
  VolunteerApplyResponseSchema,
  VolunteerProfileSchema,
  VolunteerStatusResponseSchema,
  type VolunteerApplyResponse,
  type VolunteerProfile,
  type VolunteerStatusResponse,
} from './schemas';
import { ZodError } from 'zod';

// ── GET /volunteer/profile ────────────────────────────────────────────────────

export async function fetchVolunteerProfile(): Promise<VolunteerProfile> {
  try {
    const { data } = await apiClient.get('/volunteer/profile');
    return VolunteerProfileSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}

// ── PATCH /volunteer/status ───────────────────────────────────────────────────

export async function updateVolunteerStatus(
  available: boolean,
): Promise<VolunteerStatusResponse> {
  try {
    const { data } = await apiClient.patch('/volunteer/status', { available });
    return VolunteerStatusResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // The server responded, but the payload did not match the expected schema.
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
