import { z } from 'zod';
import { CategorySchema } from './common';

// =============================================================================
// ENDPOINT: GET /lookup/categories
// MODULE:   backend/src/lookup/
// PURPOSE:  Reference data — any authenticated user can call these
// =============================================================================

// ── GET /lookup/categories ────────────────────────────────────────────────────
// Used by fetchCategories to validate responses from GET /lookup/categories

export const CategoriesResponseSchema = z.array(CategorySchema);
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
