import { useMutation } from '@tanstack/react-query';

// ── Write: apply as volunteer ─────────────────────────────────────────────────

import {
  applyAsVolunteer,
  type ApplyVolunteerBody,
} from '@/api/volunteer-apply-api';

export function useApplyAsVolunteer() {
  return useMutation({
    mutationFn: (body: ApplyVolunteerBody) => applyAsVolunteer(body),
  });
}
