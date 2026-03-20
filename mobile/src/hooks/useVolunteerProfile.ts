import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchVolunteerProfile,
  applyAsVolunteer,
  type ApplyVolunteerBody,
} from '@/api/volunteer-api';
import { queryKeys } from '@/api/keys';
import type { VolunteerProfile } from '@/api/schemas';

// =============================================================================
// TESTING MODE FLAG — GET /volunteer/profile
// - EXPO_PUBLIC_USE_MOCK_VOLUNTEER_PROFILE === 'true' → fake data, no backend
// - otherwise falls back to __DEV__ (development builds only)
// - production builds default to real API (needs backend + EXPO_PUBLIC_API_URL)
// =============================================================================
const USE_MOCK_PROFILE =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_USE_MOCK_VOLUNTEER_PROFILE === 'true';

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
    {
      specialisationId: '00000000-0000-0000-0000-000000000101',
      name: 'Anxiety',
    },
    {
      specialisationId: '00000000-0000-0000-0000-000000000102',
      name: 'Stress',
    },
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
      USE_MOCK_PROFILE ?
        async () => {
          // Simulates network delay so you can see the loading spinner
          await new Promise(resolve => setTimeout(resolve, 800));
          return MOCK_PROFILE;
        }
      : fetchVolunteerProfile, // ← real API call when USE_MOCK_PROFILE = false
  });
}

// =============================================================================
// TESTING MODE FLAG — POST /volunteer/apply
// Set USE_MOCK_APPLY = true  → fake submission, no backend needed
// Set USE_MOCK_APPLY = false → real API (needs backend running + EXPO_PUBLIC_API_URL)
// =============================================================================
const USE_MOCK_APPLY =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_USE_MOCK_VOLUNTEER_APPLY === 'true';

// Change to true to test the error state on verify.tsx
const SIMULATE_APPLY_ERROR =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_SIMULATE_APPLY_ERROR === 'true';

export function useApplyAsVolunteer() {
  // ── POST /volunteer/apply ──────────────────────────────────────────────────
  return useMutation({
    mutationFn:
      USE_MOCK_APPLY ?
        async (body: ApplyVolunteerBody) => {
          // Logs the full payload so you can verify every field is
          // correctly mapped from the form before hitting the real backend
          if (__DEV__ !== false) {
            console.log('=== POST /volunteer/apply MOCK PAYLOAD ===');
            console.log(JSON.stringify(body, null, 2));
          }

          // Simulates network delay — lets you see "Submitting..." on button
          await new Promise(resolve => setTimeout(resolve, 1200));

          if (SIMULATE_APPLY_ERROR) {
            // Simulates a 409 Conflict — triggers the inline error on verify.tsx
            // Set EXPO_PUBLIC_SIMULATE_APPLY_ERROR = true to test this path
            throw new Error('An active application already exists');
          }

          // Simulates a successful 201 response from the backend
          return {
            message: 'Application submitted',
            verificationStatus: 'pending' as const,
          };
        }
      : (body: ApplyVolunteerBody) => applyAsVolunteer(body), // ← real API call
  });
}
