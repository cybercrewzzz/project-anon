import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/api/keys';
import {
  fetchVolunteerProfile,
  updateVolunteerProfile,
  type UpdateVolunteerProfileBody,
} from '@/api/volunteer-api';
import { VolunteerProfile } from '@/api/schemas';

// =============================================================================
// TESTING MODE FLAGS
// USE_MOCK is derived from env + __DEV__:
//   • In production: defaults to real API (mocks OFF) unless
//       EXPO_PUBLIC_USE_MOCK_VOLUNTEER_PROFILE === 'true'
//   • In development: defaults to mocks ON unless
//       EXPO_PUBLIC_USE_MOCK_VOLUNTEER_PROFILE === 'false'
// =============================================================================
const USE_MOCK =
  process.env.EXPO_PUBLIC_USE_MOCK_VOLUNTEER_PROFILE === 'true' ||
  (__DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_VOLUNTEER_PROFILE !== 'false');

// =============================================================================
// ENDPOINT: GET /volunteer/profile
// SCREEN:   settings.tsx — loads name, institute, XP, level, specialisations
//           p2p-and.tsx  — reads isAvailable to set the initial toggle state
// =============================================================================

const MOCK_PROFILE: VolunteerProfile = {
  accountId: '12345678-1234-1234-1234-123456789abc',
  name: 'John Doe',
  instituteEmail: 'john@university.edu',
  instituteName: 'Institute Of Mental Health',
  grade: 'A+',
  about: 'Passionate about helping others',
  verificationStatus: 'approved',
  isAvailable: false, // → change to true to open the connect toggle as "Active"
  specialisations: [
    {
      specialisationId: '11111111-1111-1111-1111-111111111111',
      name: 'Anxiety',
    },
    {
      specialisationId: '22222222-2222-2222-2222-222222222222',
      name: 'Stress',
    },
  ],
  experience: {
    points: 150, // → try 0, 150, 300 to test XP bar fill in settings.tsx
    level: 1, // → try 1, 4, 7 to test level label in settings.tsx
  },
};

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
