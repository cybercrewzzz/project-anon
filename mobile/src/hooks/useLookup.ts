import { useQuery } from '@tanstack/react-query';
import { fetchSpecialisations } from '@/api/lookup-api';

// =============================================================================
// TESTING MODE FLAG — GET /lookup/specialisations
// Set USE_MOCK = true  → fake data, no backend needed
// Set USE_MOCK = false → real API (needs backend running + EXPO_PUBLIC_API_URL)
// =============================================================================
const USE_MOCK = false;

// =============================================================================
// ENDPOINT: GET /lookup/specialisations
// SCREEN:   src/app/volunteer/Specialisations/specialisationFilter.tsx
// PURPOSE:  Loads all specialisations to display as selectable tags
//

const MOCK_SPECIALISATIONS = [
  {
    specialisationId: 'spec-1',
    name: 'Anxiety',
    description: 'Anxiety support',
  },
  {
    specialisationId: 'spec-2',
    name: 'Stress',
    description: 'Stress management',
  },
  {
    specialisationId: 'spec-3',
    name: 'Depression',
    description: 'Depression support',
  },
  {
    specialisationId: 'spec-4',
    name: 'Angry',
    description: 'Anger management',
  },
  {
    specialisationId: 'spec-5',
    name: 'Scared',
    description: 'Fear and phobias',
  },
  {
    specialisationId: 'spec-6',
    name: 'Overwhelmed',
    description: 'Feeling overwhelmed',
  },
  {
    specialisationId: 'spec-7',
    name: 'Ashamed',
    description: 'Shame and guilt',
  },
  {
    specialisationId: 'spec-8',
    name: 'Disgusted',
    description: 'Disgust responses',
  },
  {
    specialisationId: 'spec-9',
    name: 'Frustrated',
    description: 'Frustration support',
  },
  {
    specialisationId: 'spec-10',
    name: 'Worried',
    description: 'Worry and rumination',
  },
  {
    specialisationId: 'spec-11',
    name: 'Loneliness',
    description: 'Loneliness support',
  },
  {
    specialisationId: 'spec-12',
    name: 'Pressure',
    description: 'Pressure and burnout',
  },
  {
    specialisationId: 'spec-13',
    name: 'Discouraged',
    description: 'Loss of motivation',
  },
  { specialisationId: 'spec-14', name: 'Sad', description: 'Sadness support' },
  {
    specialisationId: 'spec-15',
    name: 'Drained',
    description: 'Emotional exhaustion',
  },
  {
    specialisationId: 'spec-16',
    name: 'Breakups',
    description: 'Relationship loss',
  },
];

export function useSpecialisations() {
  // ── GET /lookup/specialisations ─────────────────────────────────────────────
  return useQuery({
    queryKey: ['specialisations'],
    queryFn:
      USE_MOCK ?
        async () => {
          // Simulates network delay
          await new Promise(resolve => setTimeout(resolve, 600));
          return MOCK_SPECIALISATIONS;
        }
      : fetchSpecialisations,
    // Specialisations rarely change — cache for 10 minutes
    staleTime: 1000 * 60 * 10,
  });
}
