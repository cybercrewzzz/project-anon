import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/api/lookup-api';
import { queryKeys } from '@/api/keys';

// =============================================================================
// TESTING MODE FLAG — GET /lookup/categories
// Set USE_MOCK = true  → fake data, no backend needed
// Set USE_MOCK = false → real API (needs backend running + EXPO_PUBLIC_API_URL)
// =============================================================================
const USE_MOCK = true;

// =============================================================================
// ENDPOINT: GET /lookup/categories
// SCREEN:   src/app/user/categorydropdownfilter/categorydropdownfilter.tsx
// PURPOSE:  Loads all problem categories to display as selectable tags
//
// HOW TO TEST:
//   STEP A → Set USE_MOCK = true, open the category screen
//            Tags render from MOCK_CATEGORIES below
//   STEP B → Set USE_MOCK = false for real API
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
  // ── GET /lookup/categories ───────────────────────────────────────────────────
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
