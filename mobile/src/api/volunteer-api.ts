import { apiClient } from './client';
import { parseApiError } from './errors';
import { VolunteerProfileSchema, type VolunteerProfile } from './schemas';


// ── GET /volunteer/profile ────────────────────────────────────────────────────

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
  tagline?: string;
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
    throw parseApiError(error);
  }
}
