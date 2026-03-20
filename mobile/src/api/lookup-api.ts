import { apiClient } from './client';
import { parseApiError } from './errors';
import {
  SpecialisationsResponseSchema,
  type SpecialisationsResponse,
} from './schemas';

// =============================================================================
// ENDPOINT: GET /lookup/specialisations
// CONTROLLER: backend/src/lookup/lookup.controller.ts
// ACCESS: Any authenticated user (no RolesGuard — JWT only)
// PURPOSE: Returns all available specialisations for selection
// =============================================================================

export async function fetchSpecialisations(): Promise<SpecialisationsResponse> {
  try {
    const { data } = await apiClient.get('/lookup/specialisations');
    return SpecialisationsResponseSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}
