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

// ── Read: load initial isAvailable state for the toggle ──────────────────────

export function useVolunteerStatus() {
  // GET /volunteer/profile — only used to read isAvailable on screen load
  return useQuery({
    queryKey: queryKeys.volunteer.profile(),
    queryFn:
      USE_MOCK ?
        async () => {
          await new Promise(resolve => setTimeout(resolve, 400));
          // Returns a minimal profile shape — only isAvailable matters here
          return {
            accountId: 'test-id',
            name: 'John Doe',
            instituteEmail: 'john@uni.edu',
            instituteName: 'Institute Of Mental Health',
            grade: 'A+',
            about: null,
            verificationStatus: 'approved',
            isAvailable: MOCK_IS_AVAILABLE, // ← controls initial toggle state
            specialisations: [],
            experience: { points: 150, level: 1 },
          } satisfies VolunteerProfile;
        }
      : fetchVolunteerProfile,
    // Keep staleTime short so the toggle stays fresh
    staleTime: 1000 * 30,
  });
}

// ── Write: flip isAvailable when toggle is pressed ───────────────────────────

export function useUpdateVolunteerStatus() {
  // PATCH /volunteer/status
  return useMutation({
    mutationFn:
      USE_MOCK ?
        async (available: boolean) => {
          // Logs payload so you can verify the correct boolean is sent
          console.log('=== PATCH /volunteer/status MOCK PAYLOAD ===');
          console.log(JSON.stringify({ available }, null, 2));

          // Simulates network delay
          await new Promise(resolve => setTimeout(resolve, 600));

          if (SIMULATE_STATUS_ERROR) {
            // Triggers the optimistic rollback — toggle snaps back
            // Set SIMULATE_STATUS_ERROR = true above to test this
            throw new Error('Failed to update status');
          }

          return { isAvailable: available };
        }
      : (available: boolean) => updateVolunteerStatus(available),

    // Optimistic update — flips the toggle in the cache immediately
    // so the UI feels instant before the server responds
    onMutate: async (available: boolean) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.volunteer.profile(),
      });
      const previous = queryClient.getQueryData<VolunteerProfile>(
        queryKeys.volunteer.profile(),
      );
      const optimisticProfile: VolunteerProfile =
        previous ?
          { ...previous, isAvailable: available }
        : {
            // minimal optimistic profile; real data will be fetched on success
            accountId: 'optimistic-id',
            name: 'Volunteer',
            instituteEmail: '',
            instituteName: '',
            grade: '',
            about: null,
            verificationStatus: 'approved',
            isAvailable: available,
            specialisations: [],
            experience: { points: 0, level: 0 },
          };
      queryClient.setQueryData<VolunteerProfile>(
        queryKeys.volunteer.profile(),
        optimisticProfile,
      );
      return { previous, hadPrevious: Boolean(previous) };
    },

    // Rolls back to the previous state if the request fails
    onError: (_err, _vars, context) => {
      if (!context) return;
      if (context.hadPrevious) {
        queryClient.setQueryData(
          queryKeys.volunteer.profile(),
          context.previous,
        );
      } else {
        // No previous profile existed: remove the optimistic entry
        queryClient.removeQueries({
          queryKey: queryKeys.volunteer.profile(),
        });
      }
    },

    onSuccess: (data) => {
      queryClient.setQueryData<VolunteerProfile>(
        queryKeys.volunteer.profile(),
        old => (old ? { ...old, isAvailable: data?.isAvailable } : old),
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.volunteer.profile(),
      });
    },
  });
}
