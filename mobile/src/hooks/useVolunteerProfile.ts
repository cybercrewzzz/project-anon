import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/api/keys';
import type { VolunteerProfile } from '@/api/schemas';
import {
  fetchVolunteerProfile,
  updateVolunteerStatus,
} from '@/api/volunteer-api';

// =============================================================================
// TESTING MODE FLAG — PATCH /volunteer/status
// Set USE_MOCK = true  → fake response, no backend needed
// Set USE_MOCK = false → real API (needs backend running + EXPO_PUBLIC_API_URL)
// USE_MOCK is only enabled in dev builds and when explicitly opted in via env:
//   EXPO_PUBLIC_USE_MOCK_API === 'true'
// In production (__DEV__ === false), this will always be false and the real API
// will be used.
// =============================================================================
const USE_MOCK =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_USE_MOCK_API === 'true';

// Simulate the toggle failing (tests optimistic rollback behaviour) — only when
// explicitly enabled via EXPO_PUBLIC_SIMULATE_STATUS_ERROR in dev builds.
const SIMULATE_STATUS_ERROR =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_SIMULATE_STATUS_ERROR === 'true';

// ENDPOINT: GET /volunteer/profile  (read-only, used to load initial toggle state)
// SCREEN:   src/app/volunteer/P2p-And/p2p-and.tsx
// PURPOSE:  Reads isAvailable from the profile to set the toggle on screen load
//
// MOCK_IS_AVAILABLE controls the initial mock state (used only when USE_MOCK is
// true). It is restricted to dev builds and an explicit env opt-in:
//   EXPO_PUBLIC_MOCK_VOLUNTEER_AVAILABLE === 'true'
const MOCK_IS_AVAILABLE =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_MOCK_VOLUNTEER_AVAILABLE === 'true';

// ENDPOINT: PATCH /volunteer/status
// SCREEN:   src/app/volunteer/P2p-And/p2p-and.tsx
// PURPOSE:  Flips the volunteer's isAvailable flag when toggle is pressed

// ── Mock profile data ─────────────────────────────────────────────────────────

const MOCK_PROFILE: VolunteerProfile = {
  accountId: '00000000-0000-0000-0000-000000000000',
  name: 'Mock Volunteer',
  instituteEmail: 'mock@example.com',
  instituteName: 'Mock University',
  grade: 'Mock Grade',
  about: 'This is a mock volunteer profile for testing',
  verificationStatus: 'approved',
  isAvailable: MOCK_IS_AVAILABLE,
  specialisations: [],
  experience: {
    points: 100,
    level: 1,
  },
};

// ── Read: load initial isAvailable state for the toggle ──────────────────────

export function useVolunteerStatus() {
  // GET /volunteer/profile — only used to read isAvailable on screen load
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

// ── Write: update isAvailable when toggle is pressed ─────────────────────────

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
