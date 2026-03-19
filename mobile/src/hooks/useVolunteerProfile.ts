import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/keys';
import { fetchVolunteerProfile } from '@/api/volunteer-api';
import type { VolunteerProfile } from '@/api/schemas';

// =============================================================================
// TESTING MODE FLAG — GET /volunteer/profile
// - EXPO_PUBLIC_USE_MOCK_VOLUNTEER_PROFILE === 'true' → fake data, no backend
// - otherwise falls back to __DEV__ (development builds only)
// - production builds default to real API (needs backend + EXPO_PUBLIC_API_URL)
// =============================================================================
const USE_MOCK =
  (
    typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_USE_MOCK_VOLUNTEER_PROFILE != null
  ) ?
    process.env.EXPO_PUBLIC_USE_MOCK_VOLUNTEER_PROFILE === 'true'
  : typeof __DEV__ !== 'undefined' ? __DEV__
  : false;

const MOCK_PROFILE: VolunteerProfile = {
  accountId: '00000000-0000-0000-0000-000000000001',
  name: 'John Doe', // → profile card header
  instituteEmail: 'john@university.edu',
  instituteName: 'Institute Of Mental Health', // → under name in profile card
  grade: 'A+',
  about: 'Passionate about helping others',
  verificationStatus: 'approved',
  isAvailable: true,
  specialisations: [
    { specialisationId: '00000000-0000-0000-0000-000000000101', name: 'Anxiety' },
    { specialisationId: '00000000-0000-0000-0000-000000000102', name: 'Stress' },
  ],
  experience: {
    points: 150, // → try 0, 150, 300 to test XP bar fill
    level: 1, // → try 1, 4, 7 to test level label
  },
};

// ── Read: volunteer profile ───────────────────────────────────────────────────

export function useVolunteerProfile() {
  // ── GET /volunteer/profile ─────────────────────────────────────────────────
  return useQuery({
    queryKey: queryKeys.volunteer.profile(),
    queryFn:
      USE_MOCK ?
        async () => {
          // Simulates network delay so you can see the loading spinner
          await new Promise(resolve => setTimeout(resolve, 800));
          return MOCK_PROFILE;
        }
      : fetchVolunteerProfile, // ← real API call when USE_MOCK = false
  });
}
