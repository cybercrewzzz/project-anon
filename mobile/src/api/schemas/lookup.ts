import { z } from 'zod';
import { CategorySchema } from './common';

// =============================================================================
// ENDPOINT: GET /lookup/categories
// MODULE:   backend/src/lookup/
// PURPOSE:  Reference data — any authenticated user can call these
// =============================================================================

// ── GET /lookup/categories ────────────────────────────────────────────────────
// Not used yet — added here so it's ready when the seeker flow needs it

export const CategoriesResponseSchema = z.array(CategorySchema);
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
