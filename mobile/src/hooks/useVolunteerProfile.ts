import { useQuery} from '@tanstack/react-query';
//import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/api/keys';
import {
  fetchVolunteerProfile,
  //updateVolunteerProfile,
  //updateVolunteerStatus,
  //type UpdateVolunteerProfileBody,
} from '@/api/volunteer-api';
import type { VolunteerProfile } from '@/api/schemas';

// =============================================================================
// TESTING MODE FLAG — GET /volunteer/profile
// Set USE_MOCK = true  → fake data, no backend needed
// Set USE_MOCK = false → real API (needs backend running + EXPO_PUBLIC_API_URL)
// =============================================================================
const USE_MOCK = true;

const MOCK_PROFILE: VolunteerProfile = {
  accountId: 'test-account-id',
  name: 'John Doe', // → profile card header
  instituteEmail: 'john@university.edu',
  instituteName: 'Institute Of Mental Health', // → under name in profile card
  grade: 'A+',
  about: 'Passionate about helping others',
  verificationStatus: 'approved',
  isAvailable: true,
  specialisations: [
    { specialisationId: 'spec-1', name: 'Anxiety' },
    { specialisationId: 'spec-2', name: 'Stress' },
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

