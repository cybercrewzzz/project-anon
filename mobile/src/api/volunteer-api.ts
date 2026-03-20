import { apiClient } from './client';
import { parseApiError } from './errors';
import {
  VolunteerProfileSchema,
  VolunteerStatusResponseSchema,
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
