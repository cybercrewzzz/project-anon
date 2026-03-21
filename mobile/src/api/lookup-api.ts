import { apiClient } from './client';
import { parseApiError } from './errors';
import {
  SpecialisationsResponseSchema,
  CategoriesResponseSchema,
  type CategoriesResponse,
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
    const { data } = await apiClient.get('/specialisations');
    return SpecialisationsResponseSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}

// =============================================================================
// ENDPOINT: GET /lookup/categories
// CONTROLLER: backend/src/lookup/lookup.controller.ts
// ACCESS: Any authenticated user (no RolesGuard — JWT only)
// PURPOSE: Returns all available categories (used in the seeker flow)
// NOTE: Used via useCategories() when USE_MOCK is false (category screen consumes that hook)
// =============================================================================

export async function fetchCategories(): Promise<CategoriesResponse> {
  try {
    const { data } = await apiClient.get('/lookup/categories');
    return CategoriesResponseSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}
