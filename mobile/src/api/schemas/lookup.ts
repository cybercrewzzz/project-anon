import { z } from 'zod';
import { SpecialisationSchema } from './common';

// =============================================================================
// ENDPOINT: GET /lookup/specialisations
// MODULE:   backend/src/lookup/
// PURPOSE:  Reference data — any authenticated user can call these
// =============================================================================

export const SpecialisationsResponseSchema = z.array(SpecialisationSchema);
export type SpecialisationsResponse = z.infer<
  typeof SpecialisationsResponseSchema
>;
