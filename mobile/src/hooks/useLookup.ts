import { useQuery } from '@tanstack/react-query';
import { fetchSpecialisations, fetchCategories } from '@/api/lookup-api';
import { queryKeys } from '@/api/keys';

// =============================================================================
// TESTING MODE FLAG — Specialisations only
// Driven by __DEV__ and EXPO_PUBLIC_USE_MOCK_LOOKUP
// - In production builds (__DEV__ === false), real API is always used.
// - In development, set EXPO_PUBLIC_USE_MOCK_LOOKUP='true' to use mock data for specialisations.
// - Categories always use the real API (no mock fallback)
// =============================================================================
const USE_MOCK =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  process.env.EXPO_PUBLIC_USE_MOCK_LOOKUP === 'true';

// =============================================================================
// ENDPOINT: GET /lookup/specialisations
// SCREEN:   src/app/volunteer/Specialisations/specialisationFilter.tsx
// PURPOSE:  Loads all specialisations to display as selectable tags
// =============================================================================
export function useSpecialisations() {
  return useQuery({
    queryKey: queryKeys.specialisations,
    queryFn: fetchSpecialisations,
    // Specialisations rarely change — cache for 10 minutes
    staleTime: 1000 * 60 * 10,
  });
}

// =============================================================================
// ENDPOINT: GET /categories
// SCREEN:   src/app/user/categorydropdownfilter/
// PURPOSE:  Loads all problem categories to display as selectable tags
// NOTE:     Always uses the real API (no mock fallback)
// =============================================================================
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10,
  });
}
