import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/api/keys';
import { queryClient } from '@/api/queryClient';
import {
  fetchVolunteerProfile,
  updateVolunteerProfile,
  type UpdateVolunteerProfileBody,
} from '@/api/volunteer-api';
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
      USE_MOCK ?
        async () => {
          await new Promise(resolve => setTimeout(resolve, 800));
          return MOCK_PROFILE;
        }
      : fetchVolunteerProfile,
  });
}

// =============================================================================
// ENDPOINT: PATCH /volunteer/profile
// SCREEN:   src/app/volunteer/EditProfile/editVolunteerProfile.tsx
// PURPOSE:  Updates volunteer's about text and/or specialisation list
//
// HOW TO TEST:
//   STEP A — Successful update:
//     → Set SIMULATE_PROFILE_ERROR = false (default)
//     → Fill in about text and select specialisations on the edit screen
//     → Tap save — check terminal for logged payload:
//          === PATCH /volunteer/profile MOCK PAYLOAD ===
//          { "about": "...", "specialisationIds": ["spec-1", ...] }
//
//   STEP B — Error state:
//     → Set SIMULATE_PROFILE_ERROR = true
//     → Tap save — error should show on the edit screen
//     → Set back to false when done
// =============================================================================

const SIMULATE_PROFILE_ERROR = false;

export function useUpdateVolunteerProfile() {
  // ── PATCH /volunteer/profile ───────────────────────────────────────────────
  return useMutation({
    mutationFn:
      USE_MOCK ?
        async (body: UpdateVolunteerProfileBody) => {
          console.log('=== PATCH /volunteer/profile MOCK PAYLOAD ===');
          console.log(JSON.stringify(body, null, 2));

          // Simulates network delay — lets you see saving state on button
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (SIMULATE_PROFILE_ERROR) {
            throw new Error('Failed to update profile. Please try again.');
          }

          // Returns the updated profile shape
          return { ...MOCK_PROFILE, ...body };
        }
      : async (body: UpdateVolunteerProfileBody) =>
          updateVolunteerProfile(body),
    onSuccess: () => {
      // Refreshes the profile cache so settings.tsx shows updated data
      queryClient.invalidateQueries({
        queryKey: queryKeys.volunteer.profile(),
      });
    },
  });
}
