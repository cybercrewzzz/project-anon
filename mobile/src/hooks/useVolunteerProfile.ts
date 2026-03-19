import { useMutation } from '@tanstack/react-query';
import __DEV__  from 'expo-constants';
import { applyAsVolunteer, type ApplyVolunteerBody } from '@/api/volunteer-api';

// =============================================================================
// TESTING MODE FLAG — POST /volunteer/apply
// Set USE_MOCK = true  → fake submission, no backend needed
// Set USE_MOCK = false → real API (needs backend running + EXPO_PUBLIC_API_URL)
// =============================================================================
const USE_MOCK = false;

// Change to true to test the error state on verify.tsx
const SIMULATE_APPLY_ERROR = false;

export function useApplyAsVolunteer() {
  // ── POST /volunteer/apply ──────────────────────────────────────────────────
  return useMutation({
    mutationFn:
      USE_MOCK ?
        async (body: ApplyVolunteerBody) => {
          // Logs the full payload so you can verify every field is
          // correctly mapped from the form before hitting the real backend
          if (__DEV__) {
            console.log('=== POST /volunteer/apply MOCK PAYLOAD ===');
            console.log(JSON.stringify(body, null, 2));
          }

          // Simulates network delay — lets you see "Submitting..." on button
          await new Promise(resolve => setTimeout(resolve, 1200));

          if (SIMULATE_APPLY_ERROR) {
            // Simulates a 409 Conflict — triggers the inline error on verify.tsx
            // Set SIMULATE_APPLY_ERROR = true above to test this path
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
