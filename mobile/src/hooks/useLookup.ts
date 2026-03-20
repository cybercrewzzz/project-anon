import { useQuery } from '@tanstack/react-query';
import { fetchSpecialisations } from '@/api/lookup-api';
import { queryKeys } from '@/api/keys';

// =============================================================================
// TESTING MODE FLAG — GET /lookup/specialisations
// Driven by __DEV__ and EXPO_PUBLIC_USE_MOCK_LOOKUPS
// - In production builds (__DEV__ === false), real API is always used.
// - In development, set EXPO_PUBLIC_USE_MOCK_LOOKUPS="true" to use mock data.
// =============================================================================
const USE_MOCK =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  typeof process !== 'undefined' &&
  !!process.env &&
  process.env.EXPO_PUBLIC_USE_MOCK_LOOKUPS === 'true';

// =============================================================================
// ENDPOINT: GET /lookup/specialisations
// SCREEN:   src/app/volunteer/Specialisations/specialisationFilter.tsx
// PURPOSE:  Loads all specialisations to display as selectable tags
//

export function useSpecialisations() {
  // ── GET /lookup/specialisations ─────────────────────────────────────────────
  return useQuery({
    queryKey: queryKeys.specialisations,
    queryFn:
      USE_MOCK ?
        async () => {
          // Mock data only included in dev builds to reduce production bundle size
          const MOCK_SPECIALISATIONS = [
            {
              specialisationId: '11111111-1111-1111-1111-111111111111',
              name: 'Anxiety',
              description: 'Anxiety support',
            },
            {
              specialisationId: '22222222-2222-2222-2222-222222222222',
              name: 'Stress',
              description: 'Stress management',
            },
            {
              specialisationId: '33333333-3333-3333-3333-333333333333',
              name: 'Depression',
              description: 'Depression support',
            },
            {
              specialisationId: '44444444-4444-4444-4444-444444444444',
              name: 'Angry',
              description: 'Anger management',
            },
            {
              specialisationId: '55555555-5555-5555-5555-555555555555',
              name: 'Scared',
              description: 'Fear and phobias',
            },
            {
              specialisationId: '66666666-6666-6666-6666-666666666666',
              name: 'Overwhelmed',
              description: 'Feeling overwhelmed',
            },
            {
              specialisationId: '77777777-7777-7777-7777-777777777777',
              name: 'Ashamed',
              description: 'Shame and guilt',
            },
            {
              specialisationId: '88888888-8888-8888-8888-888888888888',
              name: 'Disgusted',
              description: 'Disgust responses',
            },
            {
              specialisationId: '99999999-9999-9999-9999-999999999999',
              name: 'Frustrated',
              description: 'Frustration support',
            },
            {
              specialisationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              name: 'Worried',
              description: 'Worry and rumination',
            },
            {
              specialisationId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
              name: 'Loneliness',
              description: 'Loneliness support',
            },
            {
              specialisationId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
              name: 'Pressure',
              description: 'Pressure and burnout',
            },
            {
              specialisationId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
              name: 'Discouraged',
              description: 'Loss of motivation',
            },
            {
              specialisationId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
              name: 'Sad',
              description: 'Sadness support',
            },
            {
              specialisationId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
              name: 'Drained',
              description: 'Emotional exhaustion',
            },
            {
              specialisationId: '00000000-0000-0000-0000-000000000000',
              name: 'Breakups',
              description: 'Relationship loss',
            },
          ];
          // Simulates network delay
          await new Promise(resolve => setTimeout(resolve, 600));
          return MOCK_SPECIALISATIONS;
        }
      : fetchSpecialisations,
    // Specialisations rarely change — cache for 10 minutes
    staleTime: 1000 * 60 * 10,
  });
}
