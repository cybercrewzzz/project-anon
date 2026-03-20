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
  { categoryId: 'cat-1', name: 'Anxious', description: 'Feeling anxious' },
  { categoryId: 'cat-2', name: 'Angry', description: 'Feeling angry' },
  { categoryId: 'cat-3', name: 'Scared', description: 'Feeling scared' },
  {
    categoryId: 'cat-4',
    name: 'Overwhelmed',
    description: 'Feeling overwhelmed',
  },
  { categoryId: 'cat-5', name: 'Ashamed', description: 'Feeling ashamed' },
  { categoryId: 'cat-6', name: 'Disgusted', description: 'Feeling disgusted' },
  {
    categoryId: 'cat-7',
    name: 'Frustrated',
    description: 'Feeling frustrated',
  },
  { categoryId: 'cat-8', name: 'Depression', description: 'Feeling depressed' },
  { categoryId: 'cat-9', name: 'Worried', description: 'Feeling worried' },
  { categoryId: 'cat-10', name: 'Loneliness', description: 'Feeling lonely' },
  { categoryId: 'cat-11', name: 'Pressure', description: 'Under pressure' },
  {
    categoryId: 'cat-12',
    name: 'Discouraged',
    description: 'Feeling discouraged',
  },
  { categoryId: 'cat-13', name: 'Sad', description: 'Feeling sad' },
  { categoryId: 'cat-14', name: 'Drained', description: 'Feeling drained' },
  {
    categoryId: 'cat-15',
    name: 'Breakups',
    description: 'Relationship issues',
  },
  { categoryId: 'cat-16', name: 'Stress', description: 'Feeling stressed' },
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
