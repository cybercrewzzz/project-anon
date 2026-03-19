import { z } from 'zod';
import { SpecialisationSchema } from './common';

// =============================================================================
// ENDPOINT: GET /lookup/specialisations
// ENDPOINT: GET /lookup/categories
// MODULE:   backend/src/lookup/
// PURPOSE:  Reference data — any authenticated user can call these
// =============================================================================

// ── GET /lookup/specialisations ───────────────────────────────────────────────

export const SpecialisationsResponseSchema = z.array(SpecialisationSchema);
export type SpecialisationsResponse = z.infer<
  typeof SpecialisationsResponseSchema
>;
