import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import {
  fetchVolunteerProfile,
  applyAsVolunteer,
  updateVolunteerStatus,
  updateVolunteerProfile,
  type ApplyVolunteerBody,
  type UpdateVolunteerProfileBody,
} from '@/api/volunteer-api';
import { queryKeys } from '@/api/keys';
import type { VolunteerProfile } from '@/api/schemas';

// =============================================================================
// ENDPOINT: GET /volunteer/profile
// SCREEN:   src/app/volunteer/settings.tsx
// PURPOSE:  Reads the initial isAvailable state for the toggle
// =============================================================================
// TESTING MODE FLAG — GET /volunteer/profile
// Set USE_MOCK_PROFILE = true  → fake response, no backend needed
// Set USE_MOCK_PROFILE = false → real API (needs backend running + EXPO_PUBLIC_API_URL)
// =============================================================================
const USE_MOCK_PROFILE =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_USE_MOCK_VOLUNTEER_PROFILE === 'true';

const MOCK_PROFILE: VolunteerProfile = {
  accountId: '00000000-0000-0000-0000-000000000000',
  name: 'Mock Volunteer',
  instituteEmail: 'mock@example.com',
  instituteName: 'Mock University',
  grade: 'Mock Grade',
  about: 'This is a mock volunteer profile for testing',
  verificationStatus: 'approved',
  isAvailable: true,
  specialisations: [],
  experience: {
    points: 100,
    level: 1,
  },
};

// ── Read: load initial isAvailable state for the toggle ──────────────────────

export function useVolunteerProfile() {
  // GET /volunteer/profile — only used to read isAvailable on screen load
  return useQuery({
    queryKey: queryKeys.volunteer.profile(),
    queryFn:
      USE_MOCK_PROFILE ?
        async () => {
          await new Promise(resolve => setTimeout(resolve, 800));
          return MOCK_PROFILE;
        }
      : fetchVolunteerProfile, // ← real API call when USE_MOCK_PROFILE = false
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
//     → Tap save — verify the edit screen navigates back and the profile
//          data refreshes (the query cache is invalidated on success)
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
      USE_MOCK_PROFILE ?
        async (body: UpdateVolunteerProfileBody) => {
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

// =============================================================================
// ENDPOINT: PATCH /volunteer/status
// SCREEN:   src/app/volunteer/settings.tsx
// PURPOSE:  Updates the isAvailable toggle state
//
// HOW TO TEST:
//   STEP A — Successful update:
//     → Set SIMULATE_STATUS_ERROR = false (default)
//     → Toggle the availability switch on the settings screen
//     → Check the toggle flips immediately (optimistic update)
//
//   STEP B — Error state:
//     → Set SIMULATE_STATUS_ERROR = true (via EXPO_PUBLIC_SIMULATE_STATUS_ERROR env)
//     → Toggle the switch — it should rollback on error
//     → Set back to false when done
//
// TESTING MODE FLAG — PATCH /volunteer/status
// Set USE_MOCK = true  → fake response, no backend needed
// Set USE_MOCK = false → real API (needs backend running + EXPO_PUBLIC_API_URL)
// =============================================================================
// ── Write: update isAvailable when toggle is pressed ─────────────────────────

const USE_MOCK =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_USE_MOCK_VOLUNTEER_STATUS === 'true';

const SIMULATE_STATUS_ERROR =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_SIMULATE_STATUS_ERROR === 'true';

export function useUpdateVolunteerStatus() {
  return useMutation({
    mutationFn:
      USE_MOCK ?
        async (available: boolean) => {
          // Simulates network delay so you can see the loading state
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Simulate error if flag is enabled
          if (SIMULATE_STATUS_ERROR) {
            throw new Error('Simulated error: status update failed');
          }

          return { isAvailable: available };
        }
      : updateVolunteerStatus, // ← real API call when USE_MOCK = false

    // Optimistic update: immediately flip the toggle before the server responds
    onMutate: async (available: boolean) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: queryKeys.volunteer.profile(),
      });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<VolunteerProfile>(
        queryKeys.volunteer.profile(),
      );

      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData<VolunteerProfile>(
          queryKeys.volunteer.profile(),
          {
            ...previousProfile,
            isAvailable: available,
          },
        );
      }

      // Return a context object with the snapshotted value
      return { previousProfile };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_error, _available, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.volunteer.profile(),
          context.previousProfile,
        );
      }
    },

    // Always refetch after error or success to ensure cache is in sync with server
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.volunteer.profile(),
      });
    },
  });
}
