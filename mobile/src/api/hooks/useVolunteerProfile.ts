import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/api/keys';
import {
  fetchVolunteerProfile,
  updateVolunteerProfile,
  updateVolunteerStatus,
  type UpdateVolunteerProfileBody,
} from '@/api/volunteer-api';
import type { VolunteerProfile } from '@/api/schemas';

// ── Read: volunteer profile ───────────────────────────────────────────────────

export function useVolunteerProfile() {
  return useQuery({
    queryKey: queryKeys.volunteer.profile(),
    queryFn: fetchVolunteerProfile,
  });
}

// ── Write: update about + specialisations ────────────────────────────────────

export function useUpdateVolunteerProfile() {
  return useMutation({
    mutationFn: (body: UpdateVolunteerProfileBody) =>
      updateVolunteerProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.volunteer.profile(),
      });
    },
  });
}

// ── Write: toggle online / offline ───────────────────────────────────────────

export function useUpdateVolunteerStatus() {
  return useMutation({
    mutationFn: (available: boolean) => updateVolunteerStatus(available),

    // Optimistic update — flip isAvailable instantly in the cache
    onMutate: async (available: boolean) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.volunteer.profile(),
      });

      const previous = queryClient.getQueryData<VolunteerProfile>(
        queryKeys.volunteer.profile(),
      );
      queryClient.setQueryData<VolunteerProfile>(
        queryKeys.volunteer.profile(),
        old => (old ? { ...old, isAvailable: available } : old),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.volunteer.profile(),
          context.previous,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.volunteer.profile(),
      });
    },
  });
}
