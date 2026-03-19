import { z } from 'zod';

// =============================================================================
// ENDPOINT: GET /lookup/categories
// MODULE:   backend/src/lookup/
// PURPOSE:  Reference data — any authenticated user can call these
// =============================================================================

// ── GET /lookup/categories ────────────────────────────────────────────────────
// Not used yet — added here so it's ready when the seeker flow needs it

export const CategorySchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CategoriesResponseSchema = z.array(CategorySchema);
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
