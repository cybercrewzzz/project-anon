import { useQuery } from '@tanstack/react-query';
import { fetchSpecialisations, fetchCategories } from '@/api/lookup-api';
import { queryKeys } from '@/api/keys';

// =============================================================================
// TESTING MODE FLAG
// Driven by __DEV__ and EXPO_PUBLIC_USE_MOCK_LOOKUP
// - In production builds (__DEV__ === false), real API is always used.
// - In development, set EXPO_PUBLIC_USE_MOCK_LOOKUP='true' to use mock data.
// =============================================================================
const USE_MOCK =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  process.env.EXPO_PUBLIC_USE_MOCK_LOOKUP === 'true';

// =============================================================================
// ENDPOINT: GET /lookup/specialisations
// SCREEN:   src/app/volunteer/Specialisations/specialisationFilter.tsx
// PURPOSE:  Loads all specialisations to display as selectable tags
//
// HOW TO TEST:
//   STEP A → In development, set EXPO_PUBLIC_USE_MOCK_LOOKUP='true'
//   STEP B → Open specialisation screen — tags render from MOCK_SPECIALISATIONS
//   STEP C → Remove or change EXPO_PUBLIC_USE_MOCK_LOOKUP for real API
// =============================================================================
export function useSpecialisations() {
  return useQuery({
    queryKey: ['specialisations'],
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

// =============================================================================
// ENDPOINT: GET /lookup/categories
// SCREEN:   src/app/user/categorydropdownfilter/categorydropdownfilter.tsx
// PURPOSE:  Loads all problem categories to display as selectable tags
//
// HOW TO TEST:
//   STEP A → In development, set EXPO_PUBLIC_USE_MOCK_LOOKUP='true'
//   STEP B → Open category screen — tags render from MOCK_CATEGORIES
//   STEP C → Remove or change EXPO_PUBLIC_USE_MOCK_LOOKUP for real API
// =============================================================================
const MOCK_CATEGORIES = [
  { categoryId: '11111111-1111-1111-1111-111111111111', name: 'Anxious', description: 'Feeling anxious' },
  { categoryId: '22222222-2222-2222-2222-222222222222', name: 'Angry', description: 'Feeling angry' },
  { categoryId: '33333333-3333-3333-3333-333333333333', name: 'Scared', description: 'Feeling scared' },
  {
    categoryId: '44444444-4444-4444-4444-444444444444',
    name: 'Overwhelmed',
    description: 'Feeling overwhelmed',
  },
  { categoryId: '55555555-5555-5555-5555-555555555555', name: 'Ashamed', description: 'Feeling ashamed' },
  { categoryId: '66666666-6666-6666-6666-666666666666', name: 'Disgusted', description: 'Feeling disgusted' },
  {
    categoryId: '77777777-7777-7777-7777-777777777777',
    name: 'Frustrated',
    description: 'Feeling frustrated',
  },
  { categoryId: '88888888-8888-8888-8888-888888888888', name: 'Depression', description: 'Feeling depressed' },
  { categoryId: '99999999-9999-9999-9999-999999999999', name: 'Worried', description: 'Feeling worried' },
  { categoryId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Loneliness', description: 'Feeling lonely' },
  { categoryId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Pressure', description: 'Under pressure' },
  {
    categoryId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'Discouraged',
    description: 'Feeling discouraged',
  },
  { categoryId: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Sad', description: 'Feeling sad' },
  { categoryId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'Drained', description: 'Feeling drained' },
  {
    categoryId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    name: 'Breakups',
    description: 'Relationship issues',
  },
  { categoryId: '00000000-0000-0000-0000-000000000000', name: 'Stress', description: 'Feeling stressed' },
];

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn:
      USE_MOCK ?
        async () => {
          await new Promise(resolve => setTimeout(resolve, 600));
          return MOCK_CATEGORIES;
        }
      : fetchCategories,
    staleTime: 1000 * 60 * 10,
  });
}
