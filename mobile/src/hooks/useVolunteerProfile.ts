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
const USE_MOCK = false;

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

// ── Write: update about + specialisations ────────────────────────────────────

// export function useUpdateVolunteerProfile() {
//   return useMutation({
//     mutationFn: (body: UpdateVolunteerProfileBody) =>
//       updateVolunteerProfile(body),
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.volunteer.profile(),
//       });
//     },
//   });
// }

// // ── Write: toggle online / offline ───────────────────────────────────────────

// export function useUpdateVolunteerStatus() {
//   return useMutation({
//     mutationFn: (available: boolean) => updateVolunteerStatus(available),

//     // Optimistic update — flip isAvailable instantly in the cache
//     onMutate: async (available: boolean) => {
//       await queryClient.cancelQueries({
//         queryKey: queryKeys.volunteer.profile(),
//       });

//       const previous = queryClient.getQueryData<VolunteerProfile>(
//         queryKeys.volunteer.profile(),
//       );
//       queryClient.setQueryData<VolunteerProfile>(
//         queryKeys.volunteer.profile(),
//         old => (old ? { ...old, isAvailable: available } : old),
//       );
//       return { previous };
//     },
//     onError: (_err, _vars, context) => {
//       if (context?.previous) {
//         queryClient.setQueryData(
//           queryKeys.volunteer.profile(),
//           context.previous,
//         );
//       }
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: queryKeys.volunteer.profile(),
//       });
//     },
//   });
// }
