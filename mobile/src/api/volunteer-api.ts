import { apiClient } from './client';
import { parseApiError } from './errors';
import { VolunteerProfileSchema, type VolunteerProfile } from './schemas';

// ── GET /volunteer/profile ───────────────────────────────────────────────────

export async function fetchVolunteerProfile(): Promise<VolunteerProfile> {
  try {
    const { data } = await apiClient.get('/volunteer/profile');
    return VolunteerProfileSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}
