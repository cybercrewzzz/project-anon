import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import {
  fetchVolunteerProfile,
  applyAsVolunteer,
  updateVolunteerStatus,
  type ApplyVolunteerBody,
} from '@/api/volunteer-api';
import { queryKeys } from '@/api/keys';
import type { VolunteerProfile } from '@/api/schemas';

// =============================================================================
// TESTING MODE FLAG — PATCH /volunteer/status
// Set USE_MOCK = true  → fake response, no backend needed
// Set USE_MOCK = false → real API (needs backend running + EXPO_PUBLIC_API_URL)
// USE_MOCK is only enabled in dev builds and when explicitly opted in via env:
//   EXPO_PUBLIC_USE_MOCK_API === 'true'
// In production (__DEV__ === false), this will always be false and the real API
// will be used.
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
