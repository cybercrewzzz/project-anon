import { apiClient } from './client';
import { parseApiError } from './errors';
import {
  VolunteerStatusResponseSchema,
  type VolunteerStatusResponse,
} from './schemas';

// ── PATCH /volunteer/status ───────────────────────────────────────────────────

export async function updateVolunteerStatus(
  available: boolean,
): Promise<VolunteerStatusResponse> {
  try {
    const { data } = await apiClient.patch('/volunteer/status', { available });
    return VolunteerStatusResponseSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}
