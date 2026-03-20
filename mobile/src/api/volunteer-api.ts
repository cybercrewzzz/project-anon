import { apiClient } from './client';
import { parseApiError, ApiError } from './errors';
import { VolunteerProfileSchema, type VolunteerProfile } from './schemas';
import { ZodError } from 'zod';

// ── GET /volunteer/profile ───────────────────────────────────────────────────

export async function fetchVolunteerProfile(): Promise<VolunteerProfile> {
  try {
    const { data } = await apiClient.get('/volunteer/profile');
    return VolunteerProfileSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}

// ── PATCH /volunteer/profile ──────────────────────────────────────────────────

export interface UpdateVolunteerProfileBody {
  about?: string;
  specialisationIds?: string[];
}

export async function updateVolunteerProfile(
  body: UpdateVolunteerProfileBody,
): Promise<VolunteerProfile> {
  try {
    const { data } = await apiClient.patch('/volunteer/profile', body);
    return VolunteerProfileSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // The server responded, but the payload did not match the expected schema.
      throw new ApiError(500, 'Invalid response from server');
    }
    throw parseApiError(error);
  }
}
