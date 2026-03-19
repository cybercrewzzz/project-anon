import { apiClient } from './client';
import { parseApiError } from './errors';
import { CategoriesResponseSchema, type CategoriesResponse } from './schemas';

// =============================================================================
// ENDPOINT: GET /lookup/categories
// CONTROLLER: backend/src/lookup/lookup.controller.ts
// ACCESS: Any authenticated user (no RolesGuard — JWT only)
// PURPOSE: Returns all available categories (used in the seeker flow)
// NOTE: Not wired to a screen yet — function is ready for when needed
// =============================================================================

export async function fetchCategories(): Promise<CategoriesResponse> {
  try {
    const { data } = await apiClient.get('/lookup/categories');
    return CategoriesResponseSchema.parse(data);
  } catch (error) {
    throw parseApiError(error);
  }
}
